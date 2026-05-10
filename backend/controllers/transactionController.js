const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const cloudinary = require('../config/cloudinary');
const { encryptWithDEK, decryptWithDEK } = require('../utils/crypto');
const axios = require('axios');

// ─────────────────────────────────────────────
// Helper: run key_wrap.py via stdin JSON
// ─────────────────────────────────────────────
const runKeyWrap = (payload) => new Promise((resolve, reject) => {
  const scriptPath = path.join(__dirname, '../python/key_wrap.py');
  const proc = spawn('python', [scriptPath]);
  let out = '', err = '';
  proc.stdin.write(JSON.stringify(payload));
  proc.stdin.end();
  proc.stdout.on('data', d => { out += d; });
  proc.stderr.on('data', d => { err += d; });
  proc.on('close', () => {
    try {
      const result = JSON.parse(out);
      if (result.status === 'error') return reject(new Error(result.message));
      resolve(result);
    } catch (e) {
      reject(new Error(`key_wrap.py parse error: ${err || out}`));
    }
  });
});

// ─────────────────────────────────────────────
// POST /api/transactions  – Encode & store
// ─────────────────────────────────────────────
const addTransaction = async (req, res) => {
  try {
    const { amount, type, category, note, masterPassphrase } = req.body;

    if (!masterPassphrase || masterPassphrase.trim().length < 6) {
      return res.status(400).json({ error: 'Master passphrase must be at least 6 characters.' });
    }

    // 1. Generate random 256-bit DEK
    const dekHex = crypto.randomBytes(32).toString('hex');

    // 2. Wrap the DEK with the master passphrase (PBKDF2 + AES-256-GCM)
    const wrapResult = await runKeyWrap({ command: 'wrap', dek: dekHex, passphrase: masterPassphrase });
    const wrappedKey = wrapResult.wrapped;

    // 3. Encrypt transaction data with the DEK
    const transactionData = JSON.stringify({ amount, type, category, note, date: new Date().toISOString() });
    const encryptedData = encryptWithDEK(transactionData, dekHex);

    // 4. LSB Steganography – hide encrypted data in base image
    const baseImagePath   = path.join(__dirname, '../assets/base.png');
    const outputImagePath = path.join(__dirname, `../assets/temp_${Date.now()}.png`);
    const stegoScriptPath = path.join(__dirname, '../python/stego.py');

    if (!fs.existsSync(baseImagePath)) {
      return res.status(500).json({ error: 'Base image not found. Run generate_base.py first.' });
    }

    const stegoProc = spawn('python', [stegoScriptPath, 'encode', baseImagePath, encryptedData, outputImagePath]);
    let stegoOut = '';
    for await (const chunk of stegoProc.stdout) stegoOut += chunk;
    const stegoResult = stegoOut ? JSON.parse(stegoOut) : null;
    if (!stegoResult || stegoResult.status !== 'success') throw new Error('Steganography encoding failed');

    // 5. Upload cipher image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(outputImagePath, { folder: 'hail_mary_transactions' });
    fs.unlinkSync(outputImagePath);

    // 6. Save to MongoDB (wrappedKey stored for vault-based decryption)
    const newTransaction = new Transaction({
      imageUrl: uploadResponse.secure_url,
      amount:   parseFloat(amount),
      type,
      wrappedKey,
      encryptionScheme: 'dek-wrapped',
    });
    await newTransaction.save();

    res.status(201).json({
      message: 'Transaction securely stored',
      imageUrl: uploadResponse.secure_url,
      id: newTransaction._id,
      wrappedKey,        // Client downloads this as a .key file
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Server Error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/transactions  – List (all locked)
// ─────────────────────────────────────────────
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    // Return metadata only – payload stays locked until explicit decrypt
    const result = transactions.map(tx => ({
      _id:      tx._id,
      imageUrl: tx.imageUrl,
      amount:   tx.amount,
      type:     tx.type,
      encryptionScheme: tx.encryptionScheme || 'legacy-passkey',
      hasWrappedKey:    !!tx.wrappedKey,
      data: { isLocked: true, amount: tx.amount, type: tx.type },
      createdAt: tx.createdAt,
    }));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// ─────────────────────────────────────────────
// POST /api/transactions/:id/decrypt  – Vault decrypt
// ─────────────────────────────────────────────
const vaultDecrypt = async (req, res) => {
  const stegoScriptPath = path.join(__dirname, '../python/stego.py');
  let tempImagePath = null;
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    if (!tx.wrappedKey) return res.status(400).json({ error: 'No wrapped key for this transaction. Use manual decrypt.' });

    const { masterPassphrase } = req.body;
    if (!masterPassphrase) return res.status(400).json({ error: 'masterPassphrase is required' });

    // STAGE 1: Unwrap DEK (fails here if passphrase wrong – never touches image)
    let unwrapResult;
    try {
      unwrapResult = await runKeyWrap({ command: 'unwrap', wrapped: tx.wrappedKey, passphrase: masterPassphrase });
    } catch (err) {
      return res.status(401).json({ error: 'Stage 1 failed: ' + err.message, stage: 1 });
    }
    const dekHex = unwrapResult.dek;

    // STAGE 2: Download image and extract hidden payload
    tempImagePath = path.join(__dirname, `../assets/temp_dl_${Date.now()}.png`);
    const imgResponse = await axios({ url: tx.imageUrl, method: 'GET', responseType: 'stream' });
    const writer = fs.createWriteStream(tempImagePath);
    imgResponse.data.pipe(writer);
    await new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });

    const stegoProc = spawn('python', [stegoScriptPath, 'decode', tempImagePath]);
    let stegoOut = '';
    for await (const chunk of stegoProc.stdout) stegoOut += chunk;
    const stegoResult = stegoOut ? JSON.parse(stegoOut) : null;
    if (!stegoResult || stegoResult.status !== 'success') {
      return res.status(400).json({ error: 'Stage 2 failed: Could not extract hidden data from image.', stage: 2 });
    }

    // STAGE 3: Decrypt with DEK
    let decryptedData;
    try {
      decryptedData = JSON.parse(decryptWithDEK(stegoResult.data, dekHex));
    } catch (err) {
      return res.status(400).json({ error: 'Stage 3 failed: Decryption error. Data may be corrupt.', stage: 3 });
    }

    res.json({ success: true, data: decryptedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  } finally {
    if (tempImagePath && fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);
  }
};

// ─────────────────────────────────────────────
// DELETE /api/transactions/:id
// ─────────────────────────────────────────────
const deleteTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/transactions  – Wipe all
// ─────────────────────────────────────────────
const deleteAllTransactions = async (req, res) => {
  try {
    await Transaction.deleteMany({});
    res.json({ success: true, message: 'All transactions deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = { addTransaction, getTransactions, vaultDecrypt, deleteTransaction, deleteAllTransactions };

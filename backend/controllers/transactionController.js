const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const Transaction = require('../models/Transaction');
const cloudinary = require('../config/cloudinary');
const { encrypt, decrypt } = require('../utils/crypto');
const axios = require('axios');

const generatePasskey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let key = '';
    key += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    key += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    key += '0123456789'[Math.floor(Math.random() * 10)];
    key += '!@#$%^&*()_+'[Math.floor(Math.random() * 12)];
    for (let i = 0; i < 12; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key.split('').sort(() => 0.5 - Math.random()).join('');
};

// Add a transaction
const addTransaction = async (req, res) => {
  try {
    const { amount, type, category, note } = req.body;
    
    // 1. Prepare data
    const transactionData = JSON.stringify({ amount, type, category, note, date: new Date().toISOString() });
    
    // 2. Generate passkey and encrypt data
    const passkey = generatePasskey();
    const encryptedData = encrypt(transactionData, passkey);
    
    // 3. Steganography - Hide in image
    const baseImagePath = path.join(__dirname, '../assets/base.png');
    const outputImagePath = path.join(__dirname, `../assets/temp_${Date.now()}.png`);
    const stegoScriptPath = path.join(__dirname, '../python/stego.py');
    
    // Ensure assets dir exists and we have a base image
    if (!fs.existsSync(path.join(__dirname, '../assets'))) {
      fs.mkdirSync(path.join(__dirname, '../assets'), { recursive: true });
    }
    if (!fs.existsSync(baseImagePath)) {
      // Create a 100x100 white square if no base image exists for MVP purposes
      // A better approach is having a pre-existing image
      // But we will handle this by making sure we upload a base.png or use a default
      return res.status(500).json({ error: 'Base image not found. Please add a base.png to backend/assets directory.' });
    }

    const pythonProcess = spawn('python', [stegoScriptPath, 'encode', baseImagePath, encryptedData, outputImagePath]);
    
    let result = '';
    for await (const chunk of pythonProcess.stdout) {
        result += chunk;
    }
    
    const parsedResult = result ? JSON.parse(result) : null;
    
    if (!parsedResult || parsedResult.status !== 'success') {
       throw new Error("Steganography encoding failed");
    }

    // 4. Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(outputImagePath, {
      folder: 'hail_mary_transactions'
    });
    
    // 5. Save URL to MongoDB
    const newTransaction = new Transaction({
      imageUrl: uploadResponse.secure_url,
      amount: parseFloat(amount),
      type: type
    });
    await newTransaction.save();
    
    // Cleanup temp file
    fs.unlinkSync(outputImagePath);
    
    res.status(201).json({
      message: 'Transaction securely stored',
      imageUrl: uploadResponse.secure_url,
      id: newTransaction._id,
      passkey: passkey
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Get all transactions
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    const stegoScriptPath = path.join(__dirname, '../python/stego.py');
    
    const decodedTransactions = [];
    
    for (const tx of transactions) {
      try {
        // Download image temp
        const tempImagePath = path.join(__dirname, `../assets/temp_dl_${Date.now()}.png`);
        const response = await axios({
            url: tx.imageUrl,
            method: 'GET',
            responseType: 'stream'
        });
        
        const writer = fs.createWriteStream(tempImagePath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Decode via Python
        const pythonProcess = spawn('python', [stegoScriptPath, 'decode', tempImagePath]);
        let result = '';
        for await (const chunk of pythonProcess.stdout) {
            result += chunk;
        }
        
        const parsedResult = result ? JSON.parse(result) : null;
        if (parsedResult && parsedResult.status === 'success') {
            try {
                // Attempt to decrypt without passkey (will fail for new transactions)
                const decryptedString = decrypt(parsedResult.data);
                decodedTransactions.push({
                    _id: tx._id,
                    imageUrl: tx.imageUrl,
                    data: JSON.parse(decryptedString),
                    createdAt: tx.createdAt
                });
            } catch (err) {
                // Decryption failed due to missing passkey
                decodedTransactions.push({
                    _id: tx._id,
                    imageUrl: tx.imageUrl,
                    data: { isLocked: true, amount: tx.amount, type: tx.type },
                    createdAt: tx.createdAt
                });
            }
        }
        
        fs.unlinkSync(tempImagePath);
        
      } catch (err) {
        console.error(`Failed to process tx ${tx._id}:`, err.message);
        // Skip or push with error flag
      }
    }
    
    res.json(decodedTransactions);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Delete a single transaction
const deleteTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Delete all transactions (Reset)
const deleteAllTransactions = async (req, res) => {
  try {
    await Transaction.deleteMany({});
    res.json({ success: true, message: 'All transactions deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  addTransaction,
  getTransactions,
  deleteTransaction,
  deleteAllTransactions
};

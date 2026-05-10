const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const { decryptWithDEK } = require('../utils/crypto');

// Shared key-wrap runner
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
      reject(new Error(`key_wrap parse error: ${err || out}`));
    }
  });
});

/**
 * POST /api/decrypt-image
 * Accepts: multipart form with:
 *   - image: the steganographic PNG file
 *   - keyFile: the .hailkey JSON file containing the wrapped key
 *   - masterPassphrase: the user's passphrase
 */
const decryptImage = async (req, res) => {
  const stegoScriptPath = path.join(__dirname, '../python/stego.py');
  let tempImagePath = null;

  try {
    if (!req.files || !req.files['image']) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }
    if (!req.files['keyFile']) {
      return res.status(400).json({ error: 'No .hailkey file uploaded. You need both the image and the key file.' });
    }
    const { masterPassphrase } = req.body;
    if (!masterPassphrase) {
      return res.status(400).json({ error: 'Master passphrase is required.' });
    }

    // Parse the .hailkey file
    let wrappedKey;
    try {
      wrappedKey = JSON.parse(req.files['keyFile'][0].buffer.toString('utf-8'));
    } catch (e) {
      return res.status(400).json({ error: 'Invalid .hailkey file. File may be corrupt or not a valid key file.' });
    }

    // ── STAGE 1: Unwrap the DEK ──────────────────────────────────────────
    // If masterPassphrase is wrong, this fails HERE before the image is touched.
    let dekHex;
    try {
      const unwrapResult = await runKeyWrap({ command: 'unwrap', wrapped: wrappedKey, passphrase: masterPassphrase });
      dekHex = unwrapResult.dek;
    } catch (err) {
      return res.status(401).json({
        error: 'Stage 1 failed: ' + err.message,
        stage: 1,
        stageLabel: 'Key Decryption',
      });
    }

    // ── STAGE 2: Extract hidden payload from image via LSB ───────────────
    tempImagePath = req.files['image'][0].path;
    const stegoProc = spawn('python', [stegoScriptPath, 'decode', tempImagePath]);
    let stegoOut = '';
    for await (const chunk of stegoProc.stdout) stegoOut += chunk;
    const stegoResult = stegoOut ? JSON.parse(stegoOut) : null;

    if (!stegoResult || stegoResult.status !== 'success') {
      return res.status(400).json({
        error: 'Stage 2 failed: Could not extract hidden data from image.',
        stage: 2,
        stageLabel: 'Steganographic Extraction',
      });
    }

    // ── STAGE 3: Decrypt extracted ciphertext with DEK ───────────────────
    let decryptedData;
    try {
      decryptedData = JSON.parse(decryptWithDEK(stegoResult.data, dekHex));
    } catch (err) {
      return res.status(400).json({
        error: 'Stage 3 failed: AES decryption error. The key file may not match this image.',
        stage: 3,
        stageLabel: 'AES-256 Decryption',
      });
    }

    res.json({ success: true, data: decryptedData });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error during decryption.' });
  } finally {
    if (tempImagePath && fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);
  }
};

module.exports = { decryptImage };

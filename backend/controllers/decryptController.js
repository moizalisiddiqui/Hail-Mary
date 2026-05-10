const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { decrypt } = require('../utils/crypto');

const decryptImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const tempImagePath = req.file.path;
    const stegoScriptPath = path.join(__dirname, '../python/stego.py');

    // Decode via Python
    const pythonProcess = spawn('python', [stegoScriptPath, 'decode', tempImagePath]);
    let result = '';
    
    for await (const chunk of pythonProcess.stdout) {
      result += chunk;
    }
    
    const parsedResult = result ? JSON.parse(result) : null;
    
    // Clean up uploaded file
    fs.unlinkSync(tempImagePath);

    const { passkey } = req.body;

    if (parsedResult && parsedResult.status === 'success') {
      try {
        const decryptedString = decrypt(parsedResult.data, passkey);
        return res.json({ success: true, data: JSON.parse(decryptedString) });
      } catch (err) {
         return res.status(400).json({ error: 'Decryption failed. The passkey is incorrect or the image data is invalid.' });
      }
    } else {
       return res.status(400).json({ error: 'Failed to extract hidden data from the image.' });
    }
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error during decryption' });
  }
};

module.exports = { decryptImage };

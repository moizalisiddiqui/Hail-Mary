const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

const ALGORITHM = 'aes-256-cbc';
const MASTER_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'utf-8'); // Must be 32 bytes
const IV_LENGTH = 16; // For AES, this is always 16

const encrypt = (text, customKey = null) => {
  let iv = crypto.randomBytes(IV_LENGTH);
  let key = customKey ? crypto.createHash('sha256').update(customKey).digest() : MASTER_KEY;
  let cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text, customKey = null) => {
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let key = customKey ? crypto.createHash('sha256').update(customKey).digest() : MASTER_KEY;
  let decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

module.exports = { encrypt, decrypt };

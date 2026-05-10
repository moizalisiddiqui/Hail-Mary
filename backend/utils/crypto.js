const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

const ALGORITHM = 'aes-256-cbc';
const MASTER_KEY = Buffer.from(process.env.ENCRYPTION_KEY || 'fallback_key_32_chars_xxxxxxxxxx', 'utf-8').slice(0, 32);
const IV_LENGTH = 16;

/**
 * Encrypt plaintext using a raw DEK (hex string of 32 bytes).
 * Used in the new key-wrapping workflow.
 */
const encryptWithDEK = (text, dekHex) => {
  const iv  = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(dekHex, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

/**
 * Decrypt ciphertext using a raw DEK (hex string of 32 bytes).
 */
const decryptWithDEK = (text, dekHex) => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const key = Buffer.from(dekHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

/**
 * Legacy: encrypt with a string passkey (kept for backward compatibility).
 */
const encrypt = (text, customKey = null) => {
  const iv  = crypto.randomBytes(IV_LENGTH);
  const key = customKey
    ? crypto.createHash('sha256').update(customKey).digest()
    : MASTER_KEY;
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

/**
 * Legacy: decrypt with a string passkey.
 */
const decrypt = (text, customKey = null) => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const key = customKey
    ? crypto.createHash('sha256').update(customKey).digest()
    : MASTER_KEY;
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

module.exports = { encrypt, decrypt, encryptWithDEK, decryptWithDEK };

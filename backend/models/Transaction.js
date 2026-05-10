const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  amount:   { type: Number, required: true },
  type:     { type: String, enum: ['income', 'expense'], required: true },
  // Key-wrapping metadata (v2+). Null for legacy transactions.
  wrappedKey: { type: mongoose.Schema.Types.Mixed, default: null },
  encryptionScheme: {
    type: String,
    enum: ['legacy-passkey', 'dek-wrapped'],
    default: 'dek-wrapped'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);

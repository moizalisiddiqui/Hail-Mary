const express = require('express');
const router  = express.Router();
const multer  = require('multer');

const { addTransaction, getTransactions, vaultDecrypt, deleteTransaction, deleteAllTransactions } = require('../controllers/transactionController');
const { analyzeScamMessage } = require('../services/geminiService');
const { detectAnomalies, calculateSecurityScore } = require('../services/anomalyDetector');
const { decryptImage } = require('../controllers/decryptController');

// Multer: disk storage for images, memory storage for key files
const diskUpload   = multer({ dest: 'assets/uploads/' });
const mixedUpload  = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'image') cb(null, 'assets/uploads/');
      else cb(null, 'assets/uploads/');
    },
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
});

// Mixed fields uploader – image to disk, keyFile to memory
const decryptUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => cb(null, true),
}).fields([
  { name: 'image',   maxCount: 1 },
  { name: 'keyFile', maxCount: 1 },
]);

// Overwrite image field to write to disk but keyFile to memory
// Simpler: use diskStorage for image, memoryStorage for keyFile via separate approach.
// Instead, use diskStorage for both but read keyFile from disk (handled in controller).
const hybridUpload = multer({ dest: 'assets/uploads/' }).fields([
  { name: 'image',   maxCount: 1 },
  { name: 'keyFile', maxCount: 1 },
]);

// ── Transaction Routes ──────────────────────────────────────────────────────
router.post('/transactions',           addTransaction);
router.get('/transactions',            getTransactions);
router.post('/transactions/:id/decrypt', vaultDecrypt);
router.delete('/transactions/:id',     deleteTransaction);
router.delete('/transactions',         deleteAllTransactions);

// ── Manual Decrypt (image + .hailkey file) ──────────────────────────────────
router.post('/decrypt-image', (req, res, next) => {
  // Use memory storage so keyFile buffer is available in controller
  multer({
    storage: multer.memoryStorage(),
  }).fields([
    { name: 'image',   maxCount: 1 },
    { name: 'keyFile', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    // image needs to be written to disk for Python; write it manually
    const fs   = require('fs');
    const path = require('path');
    if (req.files && req.files['image']) {
      const imgFile = req.files['image'][0];
      const diskPath = path.join('assets/uploads', `${Date.now()}-image.png`);
      fs.writeFileSync(diskPath, imgFile.buffer);
      imgFile.path = diskPath;
    }
    next();
  });
}, decryptImage);

// ── Scam Analyzer ───────────────────────────────────────────────────────────
router.post('/analyze-scam', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const result = await analyzeScamMessage(message);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to analyze message' });
  }
});

// ── Analytics ───────────────────────────────────────────────────────────────
router.post('/analytics', async (req, res) => {
  try {
    const { history } = req.body;
    if (!history || !Array.isArray(history)) return res.json({ alerts: [], securityScore: 100 });
    const alerts = detectAnomalies(history);
    const securityScore = calculateSecurityScore(alerts);
    res.json({ alerts, securityScore });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Analytics failed' });
  }
});

module.exports = router;

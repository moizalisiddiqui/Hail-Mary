const express = require('express');
const router = express.Router();
const { addTransaction, getTransactions, deleteTransaction, deleteAllTransactions } = require('../controllers/transactionController');
const { analyzeScamMessage } = require('../services/geminiService');
const { detectAnomalies, calculateSecurityScore } = require('../services/anomalyDetector');
const { decryptImage } = require('../controllers/decryptController');
const multer = require('multer');

const upload = multer({ dest: 'assets/uploads/' });

// Routes
router.post('/transactions', addTransaction);
router.get('/transactions', getTransactions);
router.delete('/transactions/:id', deleteTransaction);
router.delete('/transactions', deleteAllTransactions);
router.post('/decrypt-image', upload.single('image'), decryptImage);

router.post('/analyze-scam', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    
    const analysis = await analyzeScamMessage(message);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze message' });
  }
});

router.post('/analytics', async (req, res) => {
   try {
       // Ideally we fetch history from DB, decode it, and run analytics.
       // For this MVP endpoint, we expect the frontend to pass the history
       // since decoding is an expensive operation that the frontend already does on load.
       const { transaction, history } = req.body;
       
       const alerts = detectAnomalies(transaction, history || []);
       const score = calculateSecurityScore(history || [], alerts);
       
       res.json({ alerts, securityScore: score });
   } catch (error) {
       res.status(500).json({ error: 'Analytics failed' });
   }
});

module.exports = router;

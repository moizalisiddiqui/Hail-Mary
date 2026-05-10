const detectAnomalies = (transaction, history) => {
  const alerts = [];

  // Rule 1: Large Expense
  if (transaction.type === 'expense' && parseFloat(transaction.amount) > 5000) {
    alerts.push('High value transaction detected (> $5000).');
  }

  // Rule 2: High Frequency (more than 3 transactions in the last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentTx = history.filter(tx => new Date(tx.data.date || tx.createdAt) > oneHourAgo);
  if (recentTx.length >= 3) {
    alerts.push('High frequency of transactions detected recently.');
  }

  // Rule 3: Strange Category (assuming 'gambling', 'crypto' are flagged)
  const flaggedCategories = ['gambling', 'crypto', 'unknown'];
  if (flaggedCategories.includes(transaction.category.toLowerCase())) {
    alerts.push(`Transaction in flagged category: ${transaction.category}.`);
  }

  return alerts;
};

const calculateSecurityScore = (history, alerts) => {
  let score = 100;
  
  // Base score based on encrypted storage usage
  if (history.length > 0) {
    // Each transaction is securely encrypted via steganography
    score += Math.min(history.length * 2, 20); // Cap bonus at +20
  }

  // Deduct points for alerts
  score -= (alerts.length * 15);

  // Keep within 0-100
  return Math.max(0, Math.min(100, score));
};

module.exports = { detectAnomalies, calculateSecurityScore };

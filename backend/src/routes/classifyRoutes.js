const express = require('express');
const router = express.Router();
const { classifyAmountsByContext } = require('../services/classificationService');

router.post('/', async (req, res) => {
  try {
    const { text, extractedAmounts } = req.body;
    if (!text || typeof text !== 'string' || !Array.isArray(extractedAmounts)) {
      return res.status(400).json({ error: 'OCR text and extractedAmounts array are required.' });
    }
    const classificationResult = await classifyAmountsByContext(text, extractedAmounts);
    res.status(200).json(classificationResult);
  } catch (error) {
    console.error('Error in /api/classify:', error);
    res.status(500).json({ status: 'error', reason: 'Classification failed.' });
  }
});

module.exports = router;

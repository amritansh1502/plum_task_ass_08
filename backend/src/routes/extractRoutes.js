const express = require('express');
const router = express.Router();
const { extractFinancialData, normalizeAmounts } = require('../services/localExtractorService');

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'OCR text is required in request body.' });
    }
    const extractionResult = await extractFinancialData(text);
    const { normalizedAmounts, normalizationConfidence } = normalizeAmounts(extractionResult.amounts);
    res.status(200).json({
      currency: extractionResult.currency,
      extractedAmounts: extractionResult.amounts,
      normalizedAmounts,
      normalizationConfidence,
    });
  } catch (error) {
    console.error('Error in /api/extract:', error);
    res.status(500).json({ status: 'error', reason: 'Extraction failed.' });
  }
});

module.exports = router;

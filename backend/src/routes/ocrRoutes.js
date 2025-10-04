const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/multerMiddleware');
const { getTextFromImage } = require('../services/ocrService');

router.post('/', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }
    const ocrResult = await getTextFromImage(req.file.buffer);
    res.status(200).json(ocrResult);
  } catch (error) {
    console.error('Error in /api/ocr:', error);
    res.status(500).json({ status: 'error', reason: 'OCR extraction failed.' });
  }
});

module.exports = router;

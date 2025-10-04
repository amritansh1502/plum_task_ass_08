const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/multerMiddleware');
const { getTextFromImage } = require('../services/ocrService');
const { processFinancialData } = require('../services/aiChainService');
const { finalOutputSchema } = require('../validators/schema');

router.post('/', upload.single('receipt'), async (req, res) => {
  console.log('Received request at /api/full-extract');
  try {
    let ocrText = '';
    const OCR_CONFIDENCE_THRESHOLD = 65; // Set a threshold for OCR quality
    // --- 1. GET TEXT (FROM IMAGE OR BODY) ---
    if (req.file) { // If a file is uploaded
      if (req.file.mimetype === 'text/plain') {
        console.log('Processing uploaded text file...');
        ocrText = req.file.buffer.toString('utf-8');
      } else {
        console.log('Processing uploaded image...');
        const ocrResult = await getTextFromImage(req.file.buffer);
        const { text, confidence } = ocrResult;

        // --- GUARDRAIL: Check OCR confidence ---
        if (confidence < OCR_CONFIDENCE_THRESHOLD) {
          return res.status(400).json({ status: 'no_amounts_found', reason: 'document too noisy' });
        }
        ocrText = text;
      }
    } else if (req.body.text) { // If text is sent in the body
      console.log('Processing text from request body...');
      ocrText = req.body.text;
    } else {
      return res.status(400).json({ error: 'No image file or text provided.' });
    }

    if (!ocrText.trim()) {
       return res.status(400).json({ status: 'no_amounts_found', reason: 'No text could be extracted.' });
    }

    // --- 2. EXTRACT DATA WITH AI ---
    const aiResult = await processFinancialData(ocrText);

    // --- 3. VALIDATE AI RESPONSE ---
    console.log('Validating AI response against schema...');
    const validatedData = finalOutputSchema.parse(aiResult);

    // --- 4. SEND FINAL RESPONSE ---
    const finalResponse = {
        ...validatedData,
        status: "ok"
    };

    console.log('Successfully processed request.');
    res.status(200).json(finalResponse);

  } catch (error) {
    console.error('An error occurred:', error);
    if (error.name === 'ZodError') { // Specific error for schema validation failure
        return res.status(500).json({ status: 'error', reason: 'AI output validation failed', details: error.errors });
    }
    res.status(500).json({ status: 'error', reason: 'An internal server error occurred.' });
  }
});

module.exports = router;


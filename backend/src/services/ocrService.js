const Tesseract = require('tesseract.js');
const sharp = require('sharp');

/**
 * Preprocesses the image buffer to improve OCR accuracy.
 * @param {Buffer} imageBuffer - The original image buffer.
 * @returns {Promise<Buffer>} - The preprocessed image buffer.
 */
const preprocessImage = async (imageBuffer) => {
  // Resize to max width 1024, convert to grayscale, normalize contrast
  return await sharp(imageBuffer)
    .resize({ width: 1024, withoutEnlargement: true })
    .grayscale()
    .normalize()
    .toBuffer();
};

/**
 * Extracts text from an image buffer using Tesseract.js with preprocessing.
 * @param {Buffer} imageBuffer - The buffer of the image file.
 * @returns {Promise<{text: string, confidence: number}>} - The extracted text and confidence score.
 */
const getTextFromImage = async (imageBuffer) => {
  console.log('Starting image preprocessing...');
  const preprocessedBuffer = await preprocessImage(imageBuffer);
  console.log('Image preprocessing finished.');

  console.log('Starting OCR process...');
  const result = await Tesseract.recognize(preprocessedBuffer, 'eng', {
    logger: m => console.log(m.status, `${Math.round(m.progress * 100)}%`), // Optional: Logs OCR progress
  });
  console.log('OCR process finished.');
  return {
    text: result.data.text,
    confidence: result.data.confidence,
  };
};

module.exports = { getTextFromImage };

const { extractFinancialData } = require('./localExtractorService');
const { classifyAmountsByContext } = require('./classificationService');

/**
 * Orchestrates the AI chaining process for extracting and classifying financial data.
 * @param {string} ocrText - The OCR extracted text.
 * @returns {Promise<object>} - Final structured output with currency, amounts, and confidence.
 */
const processFinancialData = async (ocrText) => {
  // Step 1: Extract raw amounts and currency
  const extractionResult = await extractFinancialData(ocrText);

  // Step 2: Classify amounts by context
  const classificationResult = await classifyAmountsByContext(ocrText, extractionResult.amounts);

  // Compose final output
  const finalOutput = {
    currency: extractionResult.currency,
    amounts: classificationResult.amounts,
    confidence: classificationResult.confidence,
  };

  return finalOutput;
};

module.exports = { processFinancialData };

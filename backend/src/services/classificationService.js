/**
 * Classifies extracted amounts by context using surrounding text.
 * @param {string} text - The full OCR text.
 * @param {Array} amounts - Array of extracted amounts with raw values.
 * @returns {Promise<object>} - Classified amounts with types and confidence.
 */
const classifyAmountsByContext = async (text, amounts) => {
  // Improved classification by matching amounts to keywords in source string more precisely

  const keywords = ['total', 'paid', 'due', 'balance', 'discount'];

  const classifiedAmounts = amounts.map(amount => {
    const { value, source } = amount;
    let type = 'unknown';
    let confidence = 0.5; // base confidence

    // Try to find the keyword closest to the amount value in the source string
    // Split source by spaces and punctuation
    const tokens = source.toLowerCase().split(/[\s,.:;]+/);

    // Find index of amount value (as string) in tokens
    // Normalize value string by removing commas and non-numeric chars
    const normalize = str => str.replace(/[,\\s]/g, '').replace(/[^0-9.]/g, '');
    const normalizedValueStr = normalize(value.toString().toLowerCase());

    // Normalize tokens similarly
    const normalizedTokens = tokens.map(token => normalize(token));

    let valueIndex = normalizedTokens.findIndex(token => token === normalizedValueStr);

    if (valueIndex === -1) {
      // If exact match not found, fallback to keyword matching in whole source
      if (/total/i.test(source)) {
        type = 'total_bill';
        confidence = 0.9;
      } else if (/paid/i.test(source)) {
        type = 'paid';
        confidence = 0.85;
      } else if (/due|balance/i.test(source)) {
        type = 'due';
        confidence = 0.8;
      } else if (/discount/i.test(source)) {
        type = 'discount';
        confidence = 0.75;
      }
    } else {
      // Check tokens around valueIndex for keywords
      const windowSize = 3; // check 3 tokens before and after
      const start = Math.max(0, valueIndex - windowSize);
      const end = Math.min(tokens.length - 1, valueIndex + windowSize);

      let foundType = null;
      for (let i = start; i <= end; i++) {
        const token = tokens[i];
        if (token === 'total') {
          foundType = 'total_bill';
          confidence = 0.9;
          break;
        } else if (token === 'paid') {
          foundType = 'paid';
          confidence = 0.85;
          break;
        } else if (token === 'due' || token === 'balance') {
          foundType = 'due';
          confidence = 0.8;
          break;
        } else if (token === 'discount') {
          foundType = 'discount';
          confidence = 0.75;
          break;
        }
      }
      if (foundType) {
        type = foundType;
      } else {
        // fallback to unknown
        type = 'unknown';
        confidence = 0.5;
      }
    }

    return {
      type,
      value,
      source,
      confidence,
    };
  });

  // Overall confidence is average of individual confidences
  const totalConfidence = classifiedAmounts.reduce((acc, amt) => acc + amt.confidence, 0);
  const averageConfidence = classifiedAmounts.length > 0 ? totalConfidence / classifiedAmounts.length : 0;

  return {
    amounts: classifiedAmounts,
    confidence: averageConfidence,
  };
};

module.exports = { classifyAmountsByContext };

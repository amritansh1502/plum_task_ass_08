/**
 * Extracts financial data from text using regular expressions.
 * @param {string} textFromOcr - The text extracted from the receipt.
 * @returns {Promise<object>} - A promise that resolves to the structured financial data.
 */
const extractFinancialData = async (textFromOcr) => {
  console.log('Starting local extraction with RegEx...');
  console.log('OCR Text input for extraction:', JSON.stringify(textFromOcr));

  // Split text into lines for multiline handling
  const lines = textFromOcr.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

  const keywords = {
    total_bill: ['total', 'total bill'],
    paid: ['paid', 'amount paid'],
    due: ['due', 'balance'],
    discount: ['discount'],
  };

  const extractedAmounts = [];
  let currency = 'UNKNOWN';

  // First, try to find a line starting with "total" to extract billed, paid, due amounts
  const totalLineIndex = lines.findIndex(line => line.toLowerCase().startsWith('total'));
  if (totalLineIndex !== -1) {
    const totalLine = lines[totalLineIndex];
    // Extract all numbers with at least one comma or decimal point from the total line to avoid isolated small numbers
    const values = totalLine.match(/(?:INR|Rs|₹|\$)?\s*((?:\d{1,3},)+\d{3}(?:\.\d+)?|\d+\.\d+)/gi) || [];
    // Map values to total_bill, paid, due if available
    if (values.length >= 3) {
      const parseValue = (val) => parseFloat(val.replace(/(?:INR|Rs|₹|\$|,)/gi, ''));
      const totalBill = parseValue(values[0]);
      const paid = parseValue(values[1]);
      const due = parseValue(values[2]);
      if (!isNaN(totalBill)) {
        extractedAmounts.push({
          type: 'total_bill',
          value: totalBill,
          source: `total ${values[0]}`,
        });
      }
      if (!isNaN(paid)) {
        extractedAmounts.push({
          type: 'paid',
          value: paid,
          source: `paid ${values[1]}`,
        });
      }
      if (!isNaN(due)) {
        extractedAmounts.push({
          type: 'due',
          value: due,
          source: `due ${values[2]}`,
        });
      }
    }
  }

  // If no total line found or no amounts extracted, fallback to previous keyword-based extraction
  if (extractedAmounts.length === 0) {
    // Iterate lines to find keywords and their values in next line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();

      // Check if line contains multiple keywords concatenated
      const foundKeys = [];
      for (const [type, keys] of Object.entries(keywords)) {
        for (const key of keys) {
          if (line.includes(key)) {
            foundKeys.push({ type, key });
          }
        }
      }

      if (foundKeys.length > 1 && i + 1 < lines.length) {
        // Next line should contain multiple values separated by spaces
        const valuesLine = lines[i + 1];
        const values = valuesLine.match(/(?:INR|Rs|₹|\$)?\s*([\d,]+\.?\d*)%?/gi) || [];

        for (let idx = 0; idx < foundKeys.length; idx++) {
          const { type, key } = foundKeys[idx];
          if (idx < values.length) {
            const valueStr = values[idx].replace(/(?:INR|Rs|₹|\$|\s|%)/gi, '');
            const value = parseFloat(valueStr.replace(/,/g, ''));
              if (!isNaN(value)) {
                extractedAmounts.push({
                  type,
                  value,
                  source: key + ' ' + values[idx],
                });
              } else {
                console.warn(`Skipping invalid number for type ${type}:`, valueStr);
              }
          }
        }
        i++; // Skip next line as it is values line
      } else {
        // Existing logic for single keyword per line
        for (const [type, keys] of Object.entries(keywords)) {
          if (keys.some(key => line === key)) {
            if (i + 1 < lines.length) {
              const regex = /(?:INR|Rs|₹|\$)?\s*([\d,]+\.?\d*)%?/i;
              const valueMatch = lines[i + 1].match(regex);
              if (valueMatch) {
                const value = parseFloat(valueMatch[1].replace(/,/g, ''));
                if (!isNaN(value)) {
                  extractedAmounts.push({
                    type,
                    value,
                    source: line + ' ' + lines[i + 1],
                  });
                  i++; // Skip next line as it is value
                } else {
                  console.warn(`Skipping invalid number for type ${type}:`, valueMatch[1]);
                }
              }
            }
          }
        }
      }

      // Detect currency symbol anywhere in text
      if (currency === 'UNKNOWN') {
        const currencyMatch = line.match(/(INR|Rs|₹|\$)/i);
        if (currencyMatch) {
          currency = currencyMatch[0];
        }
      }
    }
  }

  const result = {
    currency,
    amounts: extractedAmounts,
  };

  console.log('Local extraction finished.');
  return result;
};

/**
 * Post-processes the extracted financial data to ensure correct types and currency detection.
 * @param {object} extractionResult - The result object from extractFinancialData.
 * @param {string} fullText - The full OCR text input to detect currency if missing.
 * @returns {object} - The post-processed financial data with corrected types and currency.
 */
const postProcessExtraction = (extractionResult, fullText) => {
  let { currency, amounts } = extractionResult;

  // If currency is UNKNOWN, try to detect from full text
  if (currency === 'UNKNOWN') {
    const currencyMatch = fullText.match(/(INR|Rs|₹|\$)/i);
    if (currencyMatch) {
      currency = currencyMatch[0];
    }
  } // Correct types in amounts if needed (ensure only one total_bill, paid, due)
  // If multiple total_bill types, assign based on order: total_bill, paid, due
  if (amounts.length === 3) {
    amounts = [
      { ...amounts[0], type: 'total_bill' },
      { ...amounts[1], type: 'paid' },
      { ...amounts[2], type: 'due' },
    ];
  }

  return {
    currency,
    amounts,
  };
};

/**
 * Normalizes extracted amount strings by fixing common OCR digit errors and mapping to numbers.
 * @param {Array} amounts - Array of extracted amounts with raw string values.
 * @returns {object} - Object with normalized amounts array and normalization confidence.
 */
const normalizeAmounts = (amounts) => {
  const normalizationMap = {
    'O': '0',
    'o': '0',
    'I': '1',
    'l': '1',
    '|': '1',
    'S': '5',
    's': '5',
    'B': '8',
  };

  const normalizedAmounts = [];
  let totalCorrections = 0;
  let totalChars = 0;

  for (const amount of amounts) {
    let rawValue = amount.value.toString();
    totalChars += rawValue.length;

    // Replace common OCR errors
    let correctedValue = '';
    for (const ch of rawValue) {
      correctedValue += normalizationMap[ch] || ch;
    }

    // Parse to float
    const numValue = parseFloat(correctedValue);
    if (!isNaN(numValue)) {
      normalizedAmounts.push(numValue);
      if (correctedValue !== rawValue) {
        totalCorrections += 1;
      }
    }
  }

  const normalizationConfidence = totalChars > 0 ? 1 - (totalCorrections / normalizedAmounts.length) : 1;

  return {
    normalizedAmounts,
    normalizationConfidence,
  };
};

module.exports = { extractFinancialData, postProcessExtraction, normalizeAmounts };

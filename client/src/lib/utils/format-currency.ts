/**
 * Format a number as an Egyptian currency amount
 * 
 * @param amount - The amount to format
 * @param symbol - The currency symbol to use (defaults to "ج.م")
 * @param useArabicNumerals - Whether to use Arabic numerals (defaults to false)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | string, 
  symbol = 'ج.م', 
  useArabicNumerals = false
): string {
  let numAmount: number;
  
  if (typeof amount === 'string') {
    numAmount = parseFloat(amount);
  } else {
    numAmount = amount;
  }
  
  if (isNaN(numAmount)) {
    return '0.00 ' + symbol;
  }
  
  const formatter = new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  });
  
  const formattedAmount = formatter.format(numAmount);
  
  // Convert to Arabic numerals if requested
  let result = formattedAmount;
  if (!useArabicNumerals) {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    result = result.replace(/[٠-٩]/g, (match) => {
      return String(arabicNumerals.indexOf(match));
    });
  }
  
  return `${result} ${symbol}`;
}

/**
 * Parse a formatted currency string back to a number
 * 
 * @param formattedAmount - The formatted amount to parse
 * @returns The numeric value of the currency
 */
export function parseCurrency(formattedAmount: string): number {
  // Remove currency symbol and any whitespace
  const numericString = formattedAmount
    .replace(/[^\d,.٠-٩]/g, '')
    .replace(/[٠-٩]/g, m => String("٠١٢٣٤٥٦٧٨٩".indexOf(m)))
    .replace(/,/g, '.');
  
  return parseFloat(numericString);
}

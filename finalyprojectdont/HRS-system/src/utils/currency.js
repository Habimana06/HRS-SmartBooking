/**
 * Format number as US Dollars (USD)
 * @param {number} amount - The amount to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export function formatRWF(amount, options = {}) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "$0";
  }

  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);

  return showSymbol ? formatted : formatted.replace("$", "").trim();
}

/**
 * Format number as USD with decimals (for prices)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string with decimals
 */
export function formatRWFPrice(amount) {
  return formatRWF(amount, {
    showSymbol: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

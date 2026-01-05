/**
 * Formats a number as currency using German locale (comma as decimal separator)
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "29,00 €")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formats a number using German locale without currency symbol
 * @param value - The numeric value to format
 * @returns Formatted number string (e.g., "1.234,56")
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

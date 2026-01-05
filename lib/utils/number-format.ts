/**
 * Utility functions for German number formatting
 */

/**
 * Converts a number to German format (comma as decimal separator)
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with comma as decimal separator
 */
export function formatGermanNumber(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return ""
  const formatted = value.toFixed(decimals)
  return formatted.replace(".", ",")
}

/**
 * Converts a German format number string to English format for parsing
 * @param value - The German format string (with comma)
 * @returns Number or null if invalid
 */
export function parseGermanNumber(value: string): number | null {
  if (!value) return null
  const normalized = value.replace(",", ".")
  const parsed = Number.parseFloat(normalized)
  return !isNaN(parsed) && parsed > 0 ? parsed : null
}

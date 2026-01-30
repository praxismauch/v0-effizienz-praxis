import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind CSS classes with proper conflict resolution
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date in German format: DD.MM.YYYY
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string in German format
 */
export function formatDateDE(date: string | Date | number): string {
  try {
    const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(dateObj)
  } catch (error) {
    console.error("[v0] Error formatting date:", error)
    return "-"
  }
}

/**
 * Formats a date and time in German format: DD.MM.YYYY HH:mm
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted datetime string in German format
 */
export function formatDateTimeDE(date: string | Date | number): string {
  try {
    const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj)
  } catch (error) {
    console.error("[v0] Error formatting datetime:", error)
    return "-"
  }
}

/**
 * Formats a date in German long format: DD. MMMM YYYY
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string in German long format
 */
export function formatDateLongDE(date: string | Date | number): string {
  try {
    const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(dateObj)
  } catch (error) {
    console.error("[v0] Error formatting date:", error)
    return "-"
  }
}

/**
 * Formats a month and year in German: MMMM YYYY
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted month and year in German
 */
export function formatMonthYearDE(date: string | Date | number): string {
  try {
    const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date
    return new Intl.DateTimeFormat("de-DE", {
      month: "long",
      year: "numeric",
    }).format(dateObj)
  } catch (error) {
    console.error("[v0] Error formatting month/year:", error)
    return "-"
  }
}

/**
 * Formats time in 24-hour European format: HH:mm
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted time string in 24-hour format
 */
export function formatTimeDE(date: string | Date | number): string {
  try {
    const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date
    if (isNaN(dateObj.getTime())) {
      console.error("[v0] Invalid date value in formatTimeDE:", date)
      return "-"
    }
    return new Intl.DateTimeFormat("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(dateObj)
  } catch (error) {
    console.error("[v0] Error formatting time:", error)
    return "-"
  }
}

/**
 * Formats time with seconds in 24-hour European format: HH:mm:ss
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted time string in 24-hour format with seconds
 */
export function formatTimeWithSecondsDE(date: string | Date | number): string {
  try {
    const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date
    if (isNaN(dateObj.getTime())) {
      console.error("[v0] Invalid date value in formatTimeWithSecondsDE:", date)
      return "-"
    }
    return new Intl.DateTimeFormat("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(dateObj)
  } catch (error) {
    console.error("[v0] Error formatting time:", error)
    return "-"
  }
}

/**
 * Helper function to format relative time (e.g., "vor 5 Minuten")
 * Replaces formatDistanceToNow from date-fns
 */
export function formatRelativeTimeDE(date: string | Date | number): string {
  try {
    const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return "gerade eben"
    if (diffMin < 60) return `vor ${diffMin} Minute${diffMin !== 1 ? "n" : ""}`
    if (diffHour < 24) return `vor ${diffHour} Stunde${diffHour !== 1 ? "n" : ""}`
    if (diffDay < 30) return `vor ${diffDay} Tag${diffDay !== 1 ? "en" : ""}`
    return formatDateDE(dateObj)
  } catch (error) {
    console.error("[v0] Error formatting relative time:", error)
    return "-"
  }
}

/**
 * Formats a number as currency in German format (EUR)
 * @param amount - Number to format as currency
 * @returns Formatted currency string (e.g., "1.234,56 €")
 */
export function formatCurrencyDE(amount: number): string {
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  } catch (error) {
    console.error("[v0] Error formatting currency:", error)
    return "0,00 €"
  }
}

/**
 * Formats a number with German locale (thousands separator)
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string (e.g., "1.234,56")
 */
export function formatNumberDE(num: number, decimals = 0): string {
  try {
    return new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num)
  } catch (error) {
    console.error("[v0] Error formatting number:", error)
    return "0"
  }
}

/**
 * Formats a percentage in German format
 * @param value - Percentage value (0-1 or 0-100)
 * @param isDecimal - Whether value is decimal (0-1) or whole number (0-100)
 * @returns Formatted percentage string (e.g., "12,5 %")
 */
export function formatPercentageDE(value: number, isDecimal = true): string {
  try {
    const percentage = isDecimal ? value * 100 : value
    return `${formatNumberDE(percentage, 1)} %`
  } catch (error) {
    console.error("[v0] Error formatting percentage:", error)
    return "0 %"
  }
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return `${text.substring(0, maxLength).trim()}...`
}

/**
 * Generate initials from name
 * @param name - Full name
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

/**
 * Sleep/delay utility for async operations
 * @param ms - Milliseconds to wait
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Debounce function calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === "string") return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === "object") return Object.keys(value).length === 0
  return false
}

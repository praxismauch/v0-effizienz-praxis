/**
 * Ticket Configuration Utilities
 *
 * Helper functions for working with ticket configurations.
 * Provides color, label, and icon helpers that replace hard-coded functions.
 */

import type {
  TicketStatusConfig,
  TicketPriorityConfig,
  TicketTypeConfig,
  TicketStatus,
  TicketPriority,
  TicketType,
  TicketLanguage,
  TicketOption,
} from "./types"

/**
 * Get status color class
 */
export function getStatusColor(status: TicketStatus, configs: TicketStatusConfig[] = []): string {
  const config = configs?.find((c) => c.value === status)
  if (config?.color_class) return config.color_class
  
  // Fallback colors when configs aren't loaded
  const fallbackColors: Record<TicketStatus, string> = {
    open: "bg-orange-500",
    in_progress: "bg-blue-500",
    to_test: "bg-purple-500",
    resolved: "bg-green-500",
    closed: "bg-gray-500",
    wont_fix: "bg-red-500",
  }
  return fallbackColors[status] || "bg-gray-500"
}

/**
 * Get status label (localized)
 */
export function getStatusLabel(
  status: TicketStatus,
  configs: TicketStatusConfig[] = [],
  lang: TicketLanguage = "de",
): string {
  const config = configs?.find((c) => c.value === status)
  if (config) {
    return lang === "en" && config.label_en ? config.label_en : config.label_de
  }

  // Fallback labels when configs aren't loaded
  const fallbackLabels: Record<TicketStatus, { de: string; en: string }> = {
    open: { de: "Offen", en: "Open" },
    in_progress: { de: "In Bearbeitung", en: "In Progress" },
    to_test: { de: "Zu testen", en: "To Test" },
    resolved: { de: "Gelöst", en: "Resolved" },
    closed: { de: "Geschlossen", en: "Closed" },
    wont_fix: { de: "Wird nicht behoben", en: "Won't Fix" },
  }
  return lang === "en" ? fallbackLabels[status]?.en || status : fallbackLabels[status]?.de || status
}

/**
 * Get status icon name
 */
export function getStatusIcon(status: TicketStatus, configs: TicketStatusConfig[] = []): string | null {
  const config = configs?.find((c) => c.value === status)
  return config?.icon_name || null
}

/**
 * Get priority color class
 */
export function getPriorityColor(priority: TicketPriority, configs: TicketPriorityConfig[] = []): string {
  const config = configs?.find((c) => c.value === priority)
  if (config?.color_class) return config.color_class
  
  // Fallback colors when configs aren't loaded
  const fallbackColors: Record<TicketPriority, string> = {
    low: "bg-gray-500",
    medium: "bg-blue-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  }
  return fallbackColors[priority] || "bg-gray-500"
}

/**
 * Get priority label (localized)
 */
export function getPriorityLabel(
  priority: TicketPriority,
  configs: TicketPriorityConfig[] = [],
  lang: TicketLanguage = "de",
): string {
  const config = configs?.find((c) => c.value === priority)
  if (config) {
    return lang === "en" && config.label_en ? config.label_en : config.label_de
  }

  // Fallback labels when configs aren't loaded
  const fallbackLabels: Record<TicketPriority, { de: string; en: string }> = {
    low: { de: "Niedrig", en: "Low" },
    medium: { de: "Mittel", en: "Medium" },
    high: { de: "Hoch", en: "High" },
    urgent: { de: "Dringend", en: "Urgent" },
  }
  return lang === "en" ? fallbackLabels[priority]?.en || priority : fallbackLabels[priority]?.de || priority
}

/**
 * Get priority icon name
 */
export function getPriorityIcon(priority: TicketPriority, configs: TicketPriorityConfig[] = []): string | null {
  const config = configs?.find((c) => c.value === priority)
  return config?.icon_name || null
}

/**
 * Get priority urgency level (for sorting/filtering)
 */
export function getPriorityUrgency(priority: TicketPriority, configs: TicketPriorityConfig[] = []): number {
  const config = configs?.find((c) => c.value === priority)
  return config?.urgency_level || 0
}

/**
 * Get type color class
 */
export function getTypeColor(type: TicketType, configs: TicketTypeConfig[]): string {
  // Types don't have color_class in DB, return default colors
  const colorMap: Record<TicketType, string> = {
    bug: "bg-red-500",
    feature_request: "bg-blue-500",
    question: "bg-green-500",
    other: "bg-gray-500",
  }
  return colorMap[type] || "bg-gray-500"
}

/**
 * Get type label (localized)
 */
export function getTypeLabel(type: TicketType, configs: TicketTypeConfig[] = [], lang: TicketLanguage = "de"): string {
  const config = configs?.find((c) => c.value === type)
  if (config) {
    return lang === "en" && config.label_en ? config.label_en : config.label_de
  }

  // Fallback labels when configs aren't loaded
  const fallbackLabels: Record<TicketType, { de: string; en: string }> = {
    bug: { de: "Fehler", en: "Bug" },
    feature_request: { de: "Feature-Anfrage", en: "Feature Request" },
    question: { de: "Frage", en: "Question" },
    other: { de: "Sonstiges", en: "Other" },
  }
  return lang === "en" ? fallbackLabels[type]?.en || type : fallbackLabels[type]?.de || type
}

/**
 * Get type icon name
 */
export function getTypeIcon(type: TicketType, configs: TicketTypeConfig[] = []): string | null {
  const config = configs?.find((c) => c.value === type)
  return config?.icon_name || null
}

/**
 * Convert status configs to dropdown options
 */
export function statusesToOptions(configs: TicketStatusConfig[], lang: TicketLanguage = "de"): TicketOption[] {
  return configs
    .filter((c) => c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((config) => ({
      value: config.value,
      label: lang === "en" && config.label_en ? config.label_en : config.label_de,
      color: config.color_class,
      icon: config.icon_name || undefined,
    }))
}

/**
 * Convert priority configs to dropdown options
 */
export function prioritiesToOptions(configs: TicketPriorityConfig[], lang: TicketLanguage = "de"): TicketOption[] {
  return configs
    .filter((c) => c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((config) => ({
      value: config.value,
      label: lang === "en" && config.label_en ? config.label_en : config.label_de,
      color: config.color_class,
      icon: config.icon_name || undefined,
    }))
}

/**
 * Convert type configs to dropdown options
 */
export function typesToOptions(configs: TicketTypeConfig[], lang: TicketLanguage = "de"): TicketOption[] {
  return configs
    .filter((c) => c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((config) => ({
      value: config.value,
      label: lang === "en" && config.label_en ? config.label_en : config.label_de,
      icon: config.icon_name || undefined,
    }))
}

/**
 * Format date to German locale (DD.MM.YYYY, HH:mm)
 */
export function formatDateDE(date: string | Date | null | undefined): string {
  if (!date) return "-"

  try {
    const d = typeof date === "string" ? new Date(date) : date
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
  } catch {
    return "-"
  }
}

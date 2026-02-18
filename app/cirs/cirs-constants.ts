export interface CIRSIncident {
  id: string
  incident_type: "error" | "near_error" | "adverse_event"
  severity: "low" | "medium" | "high" | "critical"
  category: string
  title: string
  description: string
  contributing_factors?: string
  immediate_actions?: string
  is_anonymous: boolean
  reporter_name?: string
  reporter_role?: string
  created_at: string
  status: "submitted" | "under_review" | "analyzed" | "closed"
  ai_suggestions?: string
  comment_count?: number
}

export const categories = [
  { value: "medication", label: "Medikation" },
  { value: "diagnosis", label: "Diagnose" },
  { value: "treatment", label: "Behandlung" },
  { value: "documentation", label: "Dokumentation" },
  { value: "communication", label: "Kommunikation" },
  { value: "hygiene", label: "Hygiene" },
  { value: "equipment", label: "Geräte/Ausstattung" },
  { value: "organization", label: "Organisation" },
  { value: "other", label: "Sonstiges" },
]

export function getSeverityColor(severity: string) {
  const colors: Record<string, string> = {
    low: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    critical: "bg-red-100 text-red-800 border-red-200",
  }
  return colors[severity] || colors.medium
}

export function getSeverityLabel(severity: string) {
  const labels: Record<string, string> = {
    low: "Niedrig",
    medium: "Mittel",
    high: "Hoch",
    critical: "Kritisch",
  }
  return labels[severity] || severity
}

export function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    error: "Fehler",
    near_error: "Beinahe-Fehler",
    adverse_event: "Unerwunschtes Ereignis",
  }
  return labels[type] || type
}

export function getCategoryLabel(cat: string) {
  return categories.find((c) => c.value === cat)?.label || cat
}

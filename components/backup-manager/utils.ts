import type { Backup } from "./types"

export function formatDateDE(dateString: string): string {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function getVerificationStatus(backup: Backup): "verified" | "failed" | "unknown" {
  const verification = backup.metadata?.verification
  if (!verification) return "unknown"
  if (verification.verified) return "verified"
  return "failed"
}

export function getBackupTypeLabel(type: string): string {
  switch (type) {
    case "manual":
      return "Manuell"
    case "automatic":
      return "Automatisch"
    case "scheduled":
      return "Geplant"
    default:
      return type
  }
}

export function getScheduleTypeLabel(type: string): string {
  switch (type) {
    case "daily":
      return "Täglich"
    case "weekly":
      return "Wöchentlich"
    case "monthly":
      return "Monatlich"
    default:
      return type
  }
}

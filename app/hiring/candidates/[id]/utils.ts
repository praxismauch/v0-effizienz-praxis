import { Badge } from "@/components/ui/badge"

export function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    new: { label: "Neu", variant: "default" },
    screening: { label: "Screening", variant: "secondary" },
    interview: { label: "Interview", variant: "secondary" },
    interviewing: { label: "Interview", variant: "secondary" },
    offer: { label: "Angebot", variant: "default" },
    hired: { label: "Eingestellt", variant: "default" },
    rejected: { label: "Abgelehnt", variant: "destructive" },
    withdrawn: { label: "Zurückgezogen", variant: "outline" },
    archived: { label: "Archiviert", variant: "outline" },
    applied: { label: "Beworben", variant: "secondary" },
  }

  const config = statusConfig[status] || { label: status, variant: "outline" as const }
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  )
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return dateString
  }
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "-"
  const numValue = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(numValue)) return "-"
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue)
}

export function getInitials(name: string): string {
  if (!name) return "??"
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function calculateAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null
  try {
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  } catch {
    return null
  }
}

export function calculateHourlyRate(monthlySalary: number | null | undefined, weeklyHours: number | null | undefined): string | null {
  if (!monthlySalary || !weeklyHours || weeklyHours === 0) return null
  const hourlyRate = (monthlySalary * 12) / (weeklyHours * 52)
  return hourlyRate.toFixed(2)
}

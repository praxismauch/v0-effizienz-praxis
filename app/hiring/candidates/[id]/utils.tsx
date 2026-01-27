import { Badge } from "@/components/ui/badge"

export const getStatusBadge = (status: string) => {
  const statusColors: Record<string, string> = {
    applied: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    screening: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    interview: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    offer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    hired: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  }

  const statusLabels: Record<string, string> = {
    applied: "Beworben",
    screening: "Prüfung",
    interview: "Interview",
    offer: "Angebot",
    hired: "Eingestellt",
    rejected: "Abgelehnt",
  }

  return (
    <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
      {statusLabels[status] || status}
    </Badge>
  )
}

export const getInitials = (name: string) => {
  if (!name || typeof name !== "string") return "??"
  const names = name
    .trim()
    .split(" ")
    .filter((n) => n.length > 0)
  if (names.length === 0) return "??"
  return names
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export const formatDate = (dateString: string | null) => {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export const formatCurrency = (amount: number | null) => {
  if (!amount) return "-"
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

export const statusVariants: Record<string, { variant: "secondary" | "default" | "destructive" | "outline"; label: string }> = {
  new: { variant: "secondary", label: "Neu" },
  screening: { variant: "default", label: "Screening" },
  interviewing: { variant: "default", label: "Interview" },
  offer: { variant: "default", label: "Angebot" },
  hired: { variant: "default", label: "Eingestellt" },
  rejected: { variant: "destructive", label: "Abgelehnt" },
  withdrawn: { variant: "outline", label: "Zurückgezogen" },
  archived: { variant: "outline", label: "Archiviert" },
}

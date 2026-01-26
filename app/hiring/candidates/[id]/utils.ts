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

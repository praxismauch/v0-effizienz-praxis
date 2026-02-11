import { Badge } from "@/components/ui/badge"

export const getStatusBadge = (status: string) => {
  const statusColors: Record<string, string> = {
    new: "bg-blue-500 text-white dark:bg-blue-600 dark:text-white",
    applied: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    screening: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    interviewing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    interview: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    offer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    hired: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    withdrawn: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    archived: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  }

  const statusLabels: Record<string, string> = {
    new: "Neu",
    applied: "Beworben",
    screening: "Screening",
    interviewing: "Interview",
    interview: "Interview",
    offer: "Angebot",
    hired: "Eingestellt",
    rejected: "Abgelehnt",
    withdrawn: "Zurückgezogen",
    archived: "Archiviert",
  }

  return (
    <Badge className={`${statusColors[status] || "bg-gray-100 text-gray-800"} text-sm px-3 py-1 font-medium`}>
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

export const calculateAge = (dateOfBirth: string | null): number | null => {
  if (!dateOfBirth) return null
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export const calculateHourlyRate = (
  salaryExpectation: number | null,
  weeklyHours: number | null
): number | null => {
  if (!salaryExpectation || !weeklyHours || weeklyHours <= 0) return null
  // Assuming monthly salary and ~4.33 weeks per month
  const weeksPerMonth = 4.33
  const monthlyHours = weeklyHours * weeksPerMonth
  return salaryExpectation / monthlyHours
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

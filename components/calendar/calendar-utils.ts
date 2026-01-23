import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { de } from "date-fns/locale"

export type CalendarEvent = {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  type: "meeting" | "training" | "maintenance" | "holiday" | "announcement" | "task" | "event" | "interview" | "other"
  priority: "low" | "medium" | "high"
  location?: string
  isAllDay: boolean
  recurrence?: string
  isRecurringInstance?: boolean
  interviewType?: string
  interviewStatus?: string
  candidateEmail?: string
  meetingLink?: string
  trainingCourseId?: string
  trainingStatus?: string
  isOnline?: boolean
}

export const HOURS = Array.from({ length: 24 }, (_, i) => i)

export const getEventTypeColor = (type: string) => {
  switch (type) {
    case "meeting":
      return "bg-blue-500"
    case "interview":
      return "bg-emerald-500"
    case "task":
      return "bg-orange-500"
    case "event":
      return "bg-purple-500"
    case "training":
      return "bg-yellow-500"
    case "maintenance":
      return "bg-red-500"
    case "holiday":
      return "bg-indigo-500"
    case "announcement":
      return "bg-pink-500"
    default:
      return "bg-gray-500"
  }
}

export const getEventTypeLabel = (type: string) => {
  const labels: Record<string, { label: string; bgColor: string; textColor: string }> = {
    meeting: { label: "Meeting", bgColor: "bg-blue-100", textColor: "text-blue-700" },
    appointment: { label: "Termin", bgColor: "bg-green-100", textColor: "text-green-700" },
    task: { label: "Aufgabe", bgColor: "bg-orange-100", textColor: "text-orange-700" },
    event: { label: "Event", bgColor: "bg-purple-100", textColor: "text-purple-700" },
    interview: { label: "Vorstellungsgespräch", bgColor: "bg-emerald-100", textColor: "text-emerald-700" },
    training: { label: "Fortbildung", bgColor: "bg-yellow-100", textColor: "text-yellow-700" },
    maintenance: { label: "Wartung", bgColor: "bg-red-100", textColor: "text-red-700" },
    holiday: { label: "Feiertag", bgColor: "bg-indigo-100", textColor: "text-indigo-700" },
    announcement: { label: "Ankündigung", bgColor: "bg-pink-100", textColor: "text-pink-700" },
    other: { label: "Sonstiges", bgColor: "bg-gray-100", textColor: "text-gray-700" },
  }
  return labels[type] || labels.other
}

export const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case "high":
      return "Hoch"
    case "medium":
      return "Mittel"
    case "low":
      return "Niedrig"
    default:
      return priority
  }
}

export const getRecurrenceLabel = (recurrence: string) => {
  switch (recurrence) {
    case "daily":
      return "Täglich"
    case "weekly":
      return "Wöchentlich"
    case "monthly":
      return "Monatlich"
    case "yearly":
      return "Jährlich"
    default:
      return ""
  }
}

export const generateCalendarDays = (currentDate: Date) => {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = []
  let day = startDate
  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }
  return days
}

export const generateWeekDays = (currentDate: Date) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const days = []
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStart, i))
  }
  return days
}

export const getViewTitle = (viewMode: "month" | "week" | "day", currentDate: Date) => {
  switch (viewMode) {
    case "month":
      return format(currentDate, "MMMM yyyy", { locale: de })
    case "week":
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
      return `${format(weekStart, "dd.MM.", { locale: de })} - ${format(weekEnd, "dd.MM.yyyy", { locale: de })}`
    case "day":
      return format(currentDate, "EEEE, dd. MMMM yyyy", { locale: de })
  }
}

export const defaultFormData = {
  title: "",
  description: "",
  startDate: format(new Date(), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  startTime: "09:00",
  endTime: "10:00",
  type: "meeting" as const,
  priority: "medium" as const,
  location: "",
  isAllDay: false,
  recurrence: "none",
  interviewType: "",
  interviewStatus: "scheduled",
  candidateEmail: "",
  meetingLink: "",
  trainingCourseId: "",
  trainingStatus: "upcoming",
  isOnline: false,
}

export type CalendarFormData = typeof defaultFormData

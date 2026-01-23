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

export type FormData = {
  title: string
  description: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  type: CalendarEvent["type"]
  priority: CalendarEvent["priority"]
  location: string
  isAllDay: boolean
  recurrence: string
  interviewType: string
  interviewStatus: string
  candidateEmail: string
  meetingLink: string
  trainingCourseId: string
  trainingStatus: string
  isOnline: boolean
}

export const EVENT_TYPE_COLORS: Record<string, string> = {
  meeting: "bg-blue-500",
  interview: "bg-emerald-500",
  task: "bg-orange-500",
  event: "bg-purple-500",
  training: "bg-yellow-500",
  maintenance: "bg-red-500",
  holiday: "bg-indigo-500",
  announcement: "bg-pink-500",
  other: "bg-gray-500",
}

export const EVENT_TYPE_LABELS: Record<string, { label: string; bgColor: string; textColor: string }> = {
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

export const HOURS = Array.from({ length: 24 }, (_, i) => i)

export const getEventTypeColor = (type: string) => EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS.other
export const getEventTypeLabel = (type: string) => EVENT_TYPE_LABELS[type] || EVENT_TYPE_LABELS.other

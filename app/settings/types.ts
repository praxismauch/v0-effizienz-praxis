export interface HandbookChapterItem {
  id: string
  name: string
  enabled: boolean
  icon: string
}

export interface SecuritySettings {
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    expiryDays: number
  }
  sessionPolicy: {
    timeoutMinutes: number
    maxConcurrentSessions: number
    requireMfa: boolean
  }
}

export interface PracticeSettings {
  name: string
  email: string
  phone: string
  address: string
  website: string
  description: string
  type: string
  timezone: string
  currency: string
  language: string
  color: string
  ai_enabled: boolean
  logo_url: string
  google_places_api_key: string
}

export interface NotificationSettings {
  emailNotifications: boolean
  taskReminders: boolean
  todoDueDateEmail: boolean
  appointmentReminders: boolean
  weeklyReport: boolean
  marketingEmails: boolean
}

export interface AppearanceSettings {
  darkMode: boolean
  language: string
  dateFormat: string
  timeFormat: string
}

export interface CalendarSettings {
  defaultView: string
  weekStart: string
  workStart: string
  workEnd: string
  showWeekends: boolean
  showHolidays: boolean
  defaultDuration: string
}

export interface HomeofficePolicy {
  id: string
  user_id: string | null
  is_allowed: boolean
  allowed_days: string[]
  allowed_start_time: string
  allowed_end_time: string
  max_days_per_week: number
  requires_reason: boolean
  requires_location_verification: boolean
}

export interface PolicyFormData {
  user_id: string | null
  is_allowed: boolean
  allowed_days: string[]
  allowed_start_time: string
  allowed_end_time: string
  max_days_per_week: number
  requires_reason: boolean
  requires_location_verification: boolean
}

export const DEFAULT_HANDBOOK_CHAPTERS: HandbookChapterItem[] = [
  { id: "leitbild", name: "Leitbild", enabled: true, icon: "Compass" },
  { id: "ziele", name: "Ziele", enabled: true, icon: "Target" },
  { id: "zustaendigkeiten", name: "Zuständigkeiten", enabled: true, icon: "ClipboardList" },
  { id: "protokolle", name: "Protokolle", enabled: true, icon: "FileText" },
  { id: "arbeitsplaetze", name: "Arbeitsplätze", enabled: true, icon: "Briefcase" },
  { id: "arbeitsmittel", name: "Arbeitsmittel", enabled: true, icon: "Wrench" },
  { id: "raeume", name: "Räume", enabled: true, icon: "DoorOpen" },
  { id: "kontakte", name: "Kontakte", enabled: true, icon: "Users" },
  { id: "organigramm", name: "Organigramm", enabled: true, icon: "Network" },
  { id: "fortbildung", name: "Fortbildung", enabled: true, icon: "GraduationCap" },
]

export const WEEK_DAYS = [
  { value: "monday", label: "Montag" },
  { value: "tuesday", label: "Dienstag" },
  { value: "wednesday", label: "Mittwoch" },
  { value: "thursday", label: "Donnerstag" },
  { value: "friday", label: "Freitag" },
  { value: "saturday", label: "Samstag" },
  { value: "sunday", label: "Sonntag" },
]

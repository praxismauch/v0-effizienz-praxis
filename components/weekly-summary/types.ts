import {
  ListTodo,
  CalendarDays,
  Users,
  FileText,
  Target,
  Workflow,
  Package,
  Wrench,
  DollarSign,
  Sparkles,
} from "lucide-react"

export interface WeeklySummarySettings {
  id?: string
  is_enabled: boolean
  send_day: number
  send_time: string
  timezone: string
  recipients: Array<{ email: string; name: string; role: string }>
  send_to_admins: boolean
  send_to_managers: boolean
  include_todos: boolean
  include_appointments: boolean
  include_team_updates: boolean
  include_documents: boolean
  include_goals: boolean
  include_workflows: boolean
  include_inventory_alerts: boolean
  include_device_maintenance: boolean
  include_financial_summary: boolean
  include_ai_insights: boolean
  include_weekly_forecast: boolean
  custom_intro: string
  custom_footer: string
  branding_color: string
  include_logo: boolean
  last_sent_at?: string
  last_sent_status?: string
  send_count?: number
}

export interface SummaryHistory {
  id: string
  sent_at: string
  recipients_count: number
  status: string
  error_message?: string
  todos_count: number
  appointments_count: number
  open_tasks: number
  completed_tasks: number
}

export const DEFAULT_SETTINGS: WeeklySummarySettings = {
  is_enabled: false,
  send_day: 1,
  send_time: "08:00",
  timezone: "Europe/Berlin",
  recipients: [],
  send_to_admins: true,
  send_to_managers: false,
  include_todos: true,
  include_appointments: true,
  include_team_updates: true,
  include_documents: true,
  include_goals: true,
  include_workflows: false,
  include_inventory_alerts: true,
  include_device_maintenance: true,
  include_financial_summary: false,
  include_ai_insights: true,
  include_weekly_forecast: true,
  custom_intro: "",
  custom_footer: "",
  branding_color: "#3b82f6",
  include_logo: true,
}

export const DAYS_OF_WEEK = [
  { value: 0, label: "Sonntag" },
  { value: 1, label: "Montag" },
  { value: 2, label: "Dienstag" },
  { value: 3, label: "Mittwoch" },
  { value: 4, label: "Donnerstag" },
  { value: 5, label: "Freitag" },
  { value: 6, label: "Samstag" },
]

export const CONTENT_SECTIONS = [
  { key: "include_todos", label: "Aufgaben & To-Dos", icon: ListTodo, description: "Offene und abgeschlossene Aufgaben" },
  { key: "include_appointments", label: "Termine", icon: CalendarDays, description: "Bevorstehende Termine der Woche" },
  { key: "include_team_updates", label: "Team-Updates", icon: Users, description: "Neue Mitarbeiter, Abwesenheiten" },
  { key: "include_documents", label: "Dokumente", icon: FileText, description: "Neue und geänderte Dokumente" },
  { key: "include_goals", label: "Ziele & Meilensteine", icon: Target, description: "Fortschritt bei Praxiszielen" },
  { key: "include_workflows", label: "Workflows", icon: Workflow, description: "Status laufender Prozesse" },
  { key: "include_inventory_alerts", label: "Inventar-Warnungen", icon: Package, description: "Niedrige Bestände, Ablaufdaten" },
  { key: "include_device_maintenance", label: "Geräte-Wartung", icon: Wrench, description: "Anstehende Wartungen" },
  { key: "include_financial_summary", label: "Finanz-Übersicht", icon: DollarSign, description: "Umsatz und Abrechnungen" },
  { key: "include_ai_insights", label: "KI-Empfehlungen", icon: Sparkles, description: "Automatische Verbesserungsvorschläge" },
  { key: "include_weekly_forecast", label: "Wochenvorschau", icon: CalendarDays, description: "Geburtstage, wichtige Termine, fällige Aufgaben der kommenden Woche" },
]

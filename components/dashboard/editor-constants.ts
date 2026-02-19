import {
  Users,
  Target,
  Workflow,
  FileText,
  Activity,
  Zap,
  Briefcase,
  BarChart3,
  CheckSquare,
  Calendar,
  Clock,
  Rss,
  Star,
  TrendingUp,
  Lightbulb,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────

export interface WidgetConfig {
  showTeamMembers: boolean
  showGoals: boolean
  showWorkflows: boolean
  showDocuments: boolean
  showActivityChart: boolean
  showQuickActions: boolean
  showRecruiting: boolean
  showActiveCandidates: boolean
  showOpenTasks: boolean
  showTodayAppointments: boolean
  showDrafts: boolean
  showWeeklyTasks: boolean
  showTodaySchedule: boolean
  showRecentActivities: boolean
  showGoogleReviews: boolean
  showTodos: boolean
  showBulletin?: boolean
  showKPIs?: boolean
  showJournalActions?: boolean
  showTimeTracking?: boolean
  columnSpans?: Record<string, number>
  rowSpans?: Record<string, number>
  todosFilterWichtig?: boolean
  todosFilterDringend?: boolean
  todosFilterPriority?: string
  widgetOrder?: string[]
  linebreaks?: string[]
}

export type DashboardConfig = WidgetConfig

// ── Helpers ────────────────────────────────────────────────────────────────────

export const isLinebreakWidget = (id: string) => id.startsWith("linebreak_")

// ── Widget definitions ─────────────────────────────────────────────────────────

export const WIDGET_DEFINITIONS = [
  { id: "showOpenTasks", label: "Offene Aufgaben", description: "Zu erledigende Aufgaben anzeigen", icon: CheckSquare },
  { id: "showTodayAppointments", label: "Termine heute", description: "Heutige Termine anzeigen", icon: Calendar },
  { id: "showActiveCandidates", label: "Aktive Kandidaten", description: "Nicht archivierte Bewerber anzeigen", icon: Users },
  { id: "showGoogleReviews", label: "Google Bewertungen", description: "Ihre Google Business Bewertungen anzeigen", icon: Star },
  { id: "showTeamMembers", label: "Team Mitglieder", description: "Anzahl der Teammitglieder anzeigen", icon: Users },
  { id: "showDrafts", label: "Entwürfe", description: "QM-Dokumentation Entwürfe", icon: FileText },
  { id: "showGoals", label: "Aktive Ziele", description: "Übersicht aktiver Ziele", icon: Target },
  { id: "showWorkflows", label: "Workflows", description: "Anzahl der Workflows anzeigen", icon: Workflow },
  { id: "showDocuments", label: "Dokumente", description: "Dokumentenanzahl anzeigen", icon: FileText },
  { id: "showRecruiting", label: "Personalsuche", description: "Offene Stellen und Bewerbungen", icon: Briefcase },
  { id: "showKPIs", label: "Praxis-Score", description: "KPI-Bewertung Ihrer Praxisleistung", icon: TrendingUp },
  { id: "showWeeklyTasks", label: "Wöchentliche Aufgaben", description: "Erledigte und ausstehende Aufgaben diese Woche", icon: BarChart3 },
  { id: "showTodaySchedule", label: "Heutige Termine", description: "Kalendertermine im Tagesverlauf", icon: Clock },
  { id: "showActivityChart", label: "Aktivitäts-Chart", description: "7-Tage Aktivitätsverlauf", icon: Activity },
  { id: "showRecentActivities", label: "Letzte Aktivitäten", description: "Aktuelle Updates aus Ihrer Praxis", icon: Rss },
  { id: "showJournalActions", label: "Journal Handlungsempfehlungen", description: "KI-generierte Handlungsempfehlungen aus dem Journal", icon: Lightbulb },
  { id: "showQuickActions", label: "Schnellaktionen", description: "Schnellzugriff auf häufige Aktionen", icon: Zap },
  { id: "showTodos", label: "Aufgaben (Todos)", description: "Gefilterte Aufgabenliste mit konfigurierbaren Filtern", icon: CheckSquare },
  { id: "showBulletin", label: "Schwarzes Brett", description: "Neueste Beiträge vom Schwarzen Brett", icon: FileText },
  { id: "showTimeTracking", label: "Zeiterfassung", description: "Ein-/Ausstempeln direkt vom Cockpit", icon: Clock },
]

export const DEFAULT_ORDER = WIDGET_DEFINITIONS.map((w) => w.id)

// ── Predefined row heights per widget ──────────────────────────────────────────
// Every widget MUST be exactly 1x, 2x, or 3x.
// Cards that show only a number/stat => 1x
// Cards with a chart or list          => 2x
// Cards with rich/long content        => 3x

export const DEFAULT_ROW_SPANS: Record<string, number> = {
  showTeamMembers: 1,
  showGoals: 1,
  showWorkflows: 1,
  showDocuments: 1,
  showRecruiting: 1,
  showOpenTasks: 1,
  showTodayAppointments: 1,
  showActiveCandidates: 1,
  showDrafts: 1,
  showTodos: 1,
  showKPIs: 1,
  showGoogleReviews: 2,
  showWeeklyTasks: 2,
  showTodaySchedule: 2,
  showActivityChart: 2,
  showRecentActivities: 2,
  showTimeTracking: 2,
  showQuickActions: 1,
  showJournalActions: 2,
  showBulletin: 2,
}

// ── Default config ─────────────────────────────────────────────────────────────

export const defaultWidgetConfig: WidgetConfig = {
  showTeamMembers: false,
  showGoals: true,
  showWorkflows: true,
  showDocuments: false,
  showActivityChart: true,
  showQuickActions: true,
  showRecruiting: false,
  showActiveCandidates: true,
  showOpenTasks: true,
  showTodayAppointments: true,
  showDrafts: false,
  showWeeklyTasks: true,
  showTodaySchedule: true,
  showRecentActivities: true,
  showGoogleReviews: true,
  showTodos: true,
  showKPIs: true,
  showJournalActions: true,
  showBulletin: true,
  showTimeTracking: true,
  columnSpans: {},
  rowSpans: { ...DEFAULT_ROW_SPANS },
  todosFilterWichtig: undefined,
  todosFilterDringend: undefined,
  todosFilterPriority: undefined,
  widgetOrder: DEFAULT_ORDER,
  linebreaks: [],
}

// ── Size option constants ──────────────────────────────────────────────────────

export const FULL_WIDTH_WIDGET_IDS = new Set(["showBulletin", "showJournalActions"])

export const COLUMN_OPTIONS = [
  { value: 0, label: "Standard" },
  { value: 1, label: "1 Spalte" },
  { value: 2, label: "2 Spalten" },
  { value: 3, label: "3 Spalten" },
  { value: 4, label: "4 Spalten" },
  { value: 5, label: "Volle Breite" },
]

export const ROW_SPAN_OPTIONS = [
  { value: 0, label: "Standard" },
  { value: 1, label: "1x" },
  { value: 2, label: "2x" },
  { value: 3, label: "3x" },
]

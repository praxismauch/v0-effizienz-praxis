import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  FileText,
  BarChart3,
  ClipboardList,
  Target,
  BookOpen,
  Contact,
  Workflow,
  CalendarDays,
  Crown,
  FolderKanban,
  LineChart,
  Package,
  Stethoscope,
  Lightbulb,
  BriefcaseBusiness,
  Pin,
  Sparkles,
  Network,
  Wrench,
  ClipboardCheck,
  Compass,
  Award,
  CalendarClock,
  Clock,
  Heart,
  MessageCircle,
  GraduationCap,
  Shield,
  TrendingUp,
  FileCheck,
  Clipboard,
  type LucideIcon,
} from "lucide-react"

export interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  key: string
  badge?: string
  beta?: boolean
}

export interface NavigationGroup {
  id: string
  label: string
  items: NavigationItem[]
}

export const DEFAULT_EXPANDED_GROUPS = [
  "overview",
  "planning",
  "data",
  "quality-management",
  "strategy",
  "team-personal",
  "praxis-einstellungen",
]

export type BadgeKey =
  | "tasks"
  | "goals"
  | "workflows"
  | "candidates"
  | "tickets"
  | "waitlist"
  | "teamMembers"
  | "responsibilities"
  | "surveys"
  | "inventory"
  | "devices"
  | "calendar"
  | "documents"
  | "cirs"
  | "contacts"
  | "hygiene"
  | "training"
  | "protocols"
  | "journal"
  | "appraisals"
  | "skills"
  | "workplaces"
  | "rooms"
  | "equipment"
  | "dienstplan"
  | "zeiterfassung"
  | "analytics"
  | "knowledge"
  | "strategy"
  | "leadership"
  | "wellbeing"
  | "leitbild"
  | "selfcheck"
  | "organigramm"
  | "schwarzesBrett"

export const DEFAULT_BADGE_COUNTS: Record<BadgeKey, number> = {
  tasks: 0,
  goals: 0,
  workflows: 0,
  candidates: 0,
  tickets: 0,
  waitlist: 0,
  teamMembers: 0,
  responsibilities: 0,
  surveys: 0,
  inventory: 0,
  devices: 0,
  calendar: 0,
  documents: 0,
  cirs: 0,
  contacts: 0,
  hygiene: 0,
  training: 0,
  protocols: 0,
  journal: 0,
  appraisals: 0,
  skills: 0,
  workplaces: 0,
  rooms: 0,
  equipment: 0,
  dienstplan: 0,
  zeiterfassung: 0,
  analytics: 0,
  knowledge: 0,
  strategy: 0,
  leadership: 0,
  wellbeing: 0,
  leitbild: 0,
  selfcheck: 0,
  organigramm: 0,
  schwarzesBrett: 0,
}

export const DEFAULT_BADGE_VISIBILITY: Record<string, boolean> = Object.keys(
  DEFAULT_BADGE_COUNTS
).reduce((acc, key) => ({ ...acc, [key]: true }), {})

export function getNavigationGroups(
  t: (key: string, fallback: string) => string
): NavigationGroup[] {
  return [
    {
      id: "overview",
      label: t("sidebar.group.overview", "Übersicht"),
      items: [
        {
          name: t("sidebar.dashboard", "Dashboard"),
          href: "/dashboard",
          icon: LayoutDashboard,
          key: "dashboard",
        },
        {
          name: t("sidebar.aiAnalysis", "KI-Analyse"),
          href: "/analysis",
          icon: BarChart3,
          key: "aiAnalysis",
        },
        {
          name: t("sidebar.academy", "Academy"),
          href: "/academy",
          icon: GraduationCap,
          key: "academy",
        },
        {
          name: t("sidebar.schwarzesBrett", "Schwarzes Brett"),
          href: "/schwarzes-brett",
          icon: Clipboard,
          key: "schwarzesBrett",
          badge: "schwarzesBrett",
        },
      ],
    },
    {
      id: "planning",
      label: t("sidebar.group.planning", "Planung & Organisation"),
      items: [
        {
          name: t("sidebar.calendar", "Kalender"),
          href: "/calendar",
          icon: CalendarDays,
          key: "calendar",
          badge: "calendar",
        },
        {
          name: t("sidebar.dienstplan", "Dienstplan"),
          href: "/dienstplan",
          icon: CalendarClock,
          key: "dienstplan",
          badge: "dienstplan",
        },
        {
          name: t("sidebar.zeiterfassung", "Zeiterfassung"),
          href: "/zeiterfassung",
          icon: Clock,
          key: "zeiterfassung",
          badge: "zeiterfassung",
        },
        {
          name: t("sidebar.tasks", "Aufgaben"),
          href: "/todos",
          icon: ClipboardList,
          key: "tasks",
          badge: "tasks",
        },
        {
          name: t("sidebar.goals", "Ziele"),
          href: "/goals",
          icon: Target,
          key: "goals",
          badge: "goals",
        },
        {
          name: t("sidebar.workflows", "Workflows"),
          href: "/workflows",
          icon: Workflow,
          key: "workflows",
          badge: "workflows",
        },
        {
          name: t("sidebar.responsibilities", "Zuständigkeiten"),
          href: "/responsibilities",
          icon: ClipboardCheck,
          key: "responsibilities",
          badge: "responsibilities",
        },
      ],
    },
    {
      id: "data",
      label: t("sidebar.group.data", "Daten & Dokumente"),
      items: [
        {
          name: t("sidebar.analytics", "Kennzahlen"),
          href: "/analytics",
          icon: LineChart,
          key: "analytics",
          badge: "analytics",
        },
        {
          name: t("sidebar.documents", "Dokumente"),
          href: "/documents",
          icon: FileText,
          key: "documents",
          badge: "documents",
        },
        {
          name: t("sidebar.journal", "Journal"),
          href: "/practice-insights",
          icon: TrendingUp,
          key: "journal",
          badge: "journal",
        },
        {
          name: t("sidebar.protocols", "Protokolle"),
          href: "/protocols",
          icon: FileCheck,
          key: "protocols",
          badge: "protocols",
        },
      ],
    },
    {
      id: "quality-management",
      label: t("sidebar.group.quality_management", "Qualitätsmanagement"),
      items: [
        {
          name: t("sidebar.knowledge", "Wissen"),
          href: "/knowledge",
          icon: BookOpen,
          key: "knowledge",
          badge: "knowledge",
        },
        {
          name: t("sidebar.cirs", "Verbesserungsmeldung"),
          href: "/cirs",
          icon: Shield,
          key: "cirs",
          badge: "cirs",
        },
        {
          name: t("sidebar.hygieneplan", "Hygieneplan"),
          href: "/hygieneplan",
          icon: Shield,
          key: "hygieneplan",
          badge: "hygiene",
        },
      ],
    },
    {
      id: "strategy",
      label: t("sidebar.group.strategy", "Strategie & Führung"),
      items: [
        {
          name: t("sidebar.strategy_journey", "Strategiepfad"),
          href: "/strategy-journey",
          icon: Compass,
          key: "strategy_journey",
          badge: "strategy",
        },
        {
          name: "Leadership",
          href: "/leadership",
          icon: Crown,
          key: "leadership",
          badge: "leadership",
        },
        {
          name: t("sidebar.wellbeing", "Mitarbeiter-Wellbeing"),
          href: "/wellbeing",
          icon: Heart,
          key: "wellbeing",
          badge: "wellbeing",
        },
        {
          name: t("sidebar.leitbild", "Leitbild"),
          href: "/leitbild",
          icon: Sparkles,
          key: "leitbild",
          badge: "leitbild",
        },
        {
          name: t("sidebar.roi_analysis", "Lohnt-es-sich-Analyse"),
          href: "/roi-analysis",
          icon: LineChart,
          key: "roi_analysis",
        },
        {
          name: "Selbstzahler-Analyse",
          href: "/igel-analysis",
          icon: Lightbulb,
          key: "igel",
        },
        {
          name: "Konkurrenzanalyse",
          href: "/competitor-analysis",
          icon: Network,
          key: "competitor_analysis",
        },
        {
          name: t("sidebar.wunschpatient", "Wunschpatient"),
          href: "/wunschpatient",
          icon: Target,
          key: "wunschpatient",
        },
      ],
    },
    {
      id: "team-personal",
      label: t("sidebar.group.team_personal", "Team & Personal"),
      items: [
        {
          name: t("sidebar.hiring", "Personalsuche"),
          href: "/hiring",
          icon: BriefcaseBusiness,
          key: "hiring",
          badge: "candidates",
        },
        {
          name: t("sidebar.team", "Team"),
          href: "/team",
          icon: Users,
          key: "team",
          badge: "teamMembers",
        },
        {
          name: t("sidebar.mitarbeitergespraeche", "Mitarbeitergespräche"),
          href: "/mitarbeitergespraeche",
          icon: MessageCircle,
          key: "mitarbeitergespraeche",
          badge: "appraisals",
        },
        {
          name: t("sidebar.selbst_check", "Selbst-Check"),
          href: "/selbst-check",
          icon: Heart,
          key: "selbst_check",
          badge: "selfcheck",
        },
        {
          name: t("sidebar.skills", "Kompetenzen"),
          href: "/skills",
          icon: Award,
          key: "skills",
          badge: "skills",
        },
        {
          name: t("sidebar.organigramm", "Organigramm"),
          href: "/organigramm",
          icon: FolderKanban,
          key: "organigramm",
          badge: "organigramm",
        },
        {
          name: t("sidebar.training", "Fortbildung"),
          href: "/training",
          icon: Award,
          key: "training",
          badge: "training",
        },
      ],
    },
    {
      id: "praxis-einstellungen",
      label: t("sidebar.group.praxis_einstellungen", "Praxis & Einstellungen"),
      items: [
        {
          name: t("sidebar.contacts", "Kontakte"),
          href: "/contacts",
          icon: Contact,
          key: "contacts",
          badge: "contacts",
        },
        {
          name: t("sidebar.surveys", "Umfragen"),
          href: "/surveys",
          icon: ClipboardList,
          key: "surveys",
          badge: "surveys",
        },
        {
          name: t("sidebar.arbeitsplaetze", "Arbeitsplätze"),
          href: "/arbeitsplaetze",
          icon: BriefcaseBusiness,
          key: "arbeitsplaetze",
          badge: "workplaces",
        },
        {
          name: t("sidebar.rooms", "Räume"),
          href: "/rooms",
          icon: Pin,
          key: "rooms",
          badge: "rooms",
        },
        {
          name: t("sidebar.arbeitsmittel", "Arbeitsmittel"),
          href: "/arbeitsmittel",
          icon: Wrench,
          key: "arbeitsmittel",
          badge: "equipment",
        },
        {
          name: t("sidebar.inventory", "Material"),
          href: "/inventory",
          icon: Package,
          key: "inventory",
          badge: "inventory",
        },
        {
          name: t("sidebar.devices", "Geräte"),
          href: "/devices",
          icon: Stethoscope,
          key: "devices",
          badge: "devices",
        },
        {
          name: t("sidebar.settings", "Einstellungen"),
          href: "/settings",
          icon: Settings,
          key: "settings",
        },
      ],
    },
  ]
}

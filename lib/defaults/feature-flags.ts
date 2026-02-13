// Default feature flags for when Supabase is not configured (preview mode)
// Mirrors the seed data from scripts/seed-feature-flags.sql

export interface DefaultFeatureFlag {
  id: string
  feature_key: string
  feature_name: string
  feature_type: "frontend" | "backend"
  parent_key: string | null
  icon_name: string | null
  route_path: string | null
  is_enabled: boolean
  is_beta: boolean
  is_protected: boolean
  allow_practice_override: boolean
  display_order: number
  description: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
  is_locked_for_ai: boolean
}

let counter = 0
function mockId(): string {
  counter++
  return `mock-${counter.toString().padStart(3, "0")}`
}

const now = new Date().toISOString()

function flag(
  key: string,
  name: string,
  type: "frontend" | "backend",
  parentKey: string | null,
  icon: string | null,
  route: string | null,
  order: number,
  desc: string,
  opts?: { beta?: boolean; protected?: boolean },
): DefaultFeatureFlag {
  return {
    id: mockId(),
    feature_key: key,
    feature_name: name,
    feature_type: type,
    parent_key: parentKey,
    icon_name: icon,
    route_path: route,
    is_enabled: true,
    is_beta: opts?.beta ?? false,
    is_protected: opts?.protected ?? false,
    allow_practice_override: true,
    display_order: order,
    description: desc,
    created_at: now,
    updated_at: now,
    updated_by: null,
    is_locked_for_ai: false,
  }
}

export const DEFAULT_FEATURE_FLAGS: DefaultFeatureFlag[] = [
  // Frontend Navigation Groups
  flag("frontend_overview", "Übersicht", "frontend", null, "LayoutDashboard", null, 1, "Übersicht-Bereich mit Dashboard und Analysen", { protected: true }),
  flag("frontend_planning", "Planung & Organisation", "frontend", null, "CalendarDays", null, 2, "Planungs- und Organisationsbereich"),
  flag("frontend_data", "Daten & Dokumente", "frontend", null, "FileText", null, 3, "Daten- und Dokumentenverwaltung"),
  flag("frontend_strategy", "Strategie & Führung", "frontend", null, "Compass", null, 4, "Strategische Planung und Führungstools"),
  flag("frontend_team", "Team & Personal", "frontend", null, "Users", null, 5, "Team- und Personalverwaltung"),
  flag("frontend_quality", "Qualitäts-Management", "frontend", null, "Shield", null, 6, "Qualitätsmanagement und Hygiene"),
  flag("frontend_praxis", "Praxis & Einstellungen", "frontend", null, "Settings", null, 7, "Praxiseinstellungen und Ressourcen"),

  // Backend Feature Groups
  flag("backend_api", "API-Funktionen", "backend", null, "Server", null, 1, "Backend API-Funktionalitäten", { protected: true }),
  flag("backend_ai", "KI-Funktionen", "backend", null, "Sparkles", null, 2, "KI- und Analysefunktionen"),
  flag("backend_integrations", "Integrationen", "backend", null, "Plug", null, 3, "Externe Integrationen und Schnittstellen"),

  // Übersicht Items
  flag("dashboard", "Dashboard", "frontend", "frontend_overview", "LayoutDashboard", "/dashboard", 1, "Haupt-Dashboard mit Übersicht", { protected: true }),
  flag("aiAnalysis", "KI-Analyse", "frontend", "frontend_overview", "BarChart3", "/analysis", 2, "KI-gestützte Praxisanalyse"),
  flag("academy", "Academy", "frontend", "frontend_overview", "GraduationCap", "/academy", 3, "Lernplattform und Schulungen", { beta: true }),

  // Planung & Organisation Items
  flag("calendar", "Kalender", "frontend", "frontend_planning", "CalendarDays", "/calendar", 1, "Praxiskalender"),
  flag("dienstplan", "Dienstplan", "frontend", "frontend_planning", "CalendarClock", "/dienstplan", 2, "Dienstplanung und Schichten"),
  flag("zeiterfassung", "Zeiterfassung", "frontend", "frontend_planning", "Clock", "/zeiterfassung", 3, "Arbeitszeit-Erfassung"),
  flag("tasks", "Aufgaben", "frontend", "frontend_planning", "ClipboardList", "/todos", 4, "Aufgabenverwaltung"),
  flag("goals", "Ziele", "frontend", "frontend_planning", "Target", "/goals", 5, "Zielverwaltung"),
  flag("workflows", "Workflows", "frontend", "frontend_planning", "Workflow", "/workflows", 6, "Automatisierte Arbeitsabläufe"),
  flag("responsibilities", "Zuständigkeiten", "frontend", "frontend_planning", "ClipboardCheck", "/responsibilities", 7, "Zuständigkeits-Matrix"),

  // Daten & Dokumente Items
  flag("analytics", "Kennzahlen", "frontend", "frontend_data", "LineChart", "/analytics", 1, "Praxis-Kennzahlen und Statistiken"),
  flag("documents", "Dokumente", "frontend", "frontend_data", "FileText", "/documents", 2, "Dokumentenverwaltung"),
  flag("journal", "Journal", "frontend", "frontend_data", "TrendingUp", "/practice-insights", 3, "Praxis-Journal und Insights"),
  flag("knowledge", "Wissen", "frontend", "frontend_data", "BookOpen", "/knowledge", 4, "Wissensdatenbank"),
  flag("protocols", "Protokolle", "frontend", "frontend_data", "FileCheck", "/protocols", 5, "Besprechungsprotokolle"),
  flag("cirs", "Verbesserungsmeldung", "frontend", "frontend_data", "Shield", "/cirs", 6, "CIRS-Meldungen und Verbesserungsvorschläge"),

  // Qualitäts-Management Items
  flag("hygieneplan", "Hygieneplan", "frontend", "frontend_quality", "Shield", "/hygieneplan", 1, "Hygieneplan und QM-Dokumentation"),

  // Strategie & Führung Items
  flag("strategy_journey", "Strategiepfad", "frontend", "frontend_strategy", "Compass", "/strategy-journey", 1, "Strategische Planung"),
  flag("leadership", "Leadership", "frontend", "frontend_strategy", "Crown", "/leadership", 2, "Führungs-Dashboard"),
  flag("wellbeing", "Mitarbeiter-Wellbeing", "frontend", "frontend_strategy", "Heart", "/wellbeing", 3, "Mitarbeiter-Wohlbefinden"),
  flag("qualitaetszirkel", "Qualitätszirkel", "frontend", "frontend_strategy", "CircleDot", "/qualitaetszirkel", 4, "QM-Zirkel-Verwaltung", { beta: true }),
  flag("leitbild", "Leitbild", "frontend", "frontend_strategy", "Sparkles", "/leitbild", 5, "Praxis-Leitbild"),
  flag("roi_analysis", "Lohnt-es-sich-Analyse", "frontend", "frontend_strategy", "LineChart", "/roi-analysis", 6, "ROI-Analyse für Investitionen"),
  flag("igel", "Selbstzahler-Analyse", "frontend", "frontend_strategy", "Lightbulb", "/igel-analysis", 7, "IGeL-Leistungen Analyse"),
  flag("competitor_analysis", "Konkurrenzanalyse", "frontend", "frontend_strategy", "Network", "/competitor-analysis", 8, "Wettbewerbsanalyse", { beta: true }),
  flag("wunschpatient", "Wunschpatient", "frontend", "frontend_strategy", "Target", "/wunschpatient", 9, "Zielgruppen-Definition"),

  // Team & Personal Items
  flag("hiring", "Personalsuche", "frontend", "frontend_team", "BriefcaseBusiness", "/hiring", 1, "Bewerbermanagement"),
  flag("team", "Team", "frontend", "frontend_team", "Users", "/team", 2, "Teamverwaltung", { protected: true }),
  flag("mitarbeitergespraeche", "Mitarbeitergespräche", "frontend", "frontend_team", "MessageCircle", "/mitarbeitergespraeche", 3, "Mitarbeitergespräche"),
  flag("selbst_check", "Selbst-Check", "frontend", "frontend_team", "Heart", "/selbst-check", 4, "Selbsteinschätzung", { beta: true }),
  flag("skills", "Kompetenzen", "frontend", "frontend_team", "Award", "/skills", 5, "Kompetenzmanagement"),
  flag("organigramm", "Organigramm", "frontend", "frontend_team", "FolderKanban", "/organigramm", 6, "Organisationsstruktur"),
  flag("training", "Fortbildung", "frontend", "frontend_team", "Award", "/training", 7, "Fortbildungsverwaltung"),

  // Praxis & Einstellungen Items
  flag("contacts", "Kontakte", "frontend", "frontend_praxis", "Contact", "/contacts", 1, "Kontaktverwaltung"),
  flag("surveys", "Umfragen", "frontend", "frontend_praxis", "ClipboardList", "/surveys", 2, "Umfragen-Verwaltung"),
  flag("arbeitsplaetze", "Arbeitsplätze", "frontend", "frontend_praxis", "BriefcaseBusiness", "/arbeitsplaetze", 3, "Arbeitsplätze-Verwaltung"),
  flag("rooms", "Räume", "frontend", "frontend_praxis", "Pin", "/rooms", 4, "Raumverwaltung"),
  flag("arbeitsmittel", "Arbeitsmittel", "frontend", "frontend_praxis", "Wrench", "/arbeitsmittel", 5, "Arbeitsmittel-Verwaltung"),
  flag("inventory", "Material", "frontend", "frontend_praxis", "Package", "/inventory", 6, "Materialverwaltung"),
  flag("devices", "Geräte", "frontend", "frontend_praxis", "Stethoscope", "/devices", 7, "Geräteverwaltung"),
  flag("settings", "Einstellungen", "frontend", "frontend_praxis", "Settings", "/settings", 8, "Praxis-Einstellungen", { protected: true }),

  // Backend API Features
  flag("api_auth", "Authentifizierung", "backend", "backend_api", "Shield", "/api/auth", 1, "Authentifizierungs-API", { protected: true }),
  flag("api_users", "Benutzer-API", "backend", "backend_api", "Users", "/api/users", 2, "Benutzerverwaltungs-API", { protected: true }),
  flag("api_practices", "Praxis-API", "backend", "backend_api", "Building2", "/api/practices", 3, "Praxisverwaltungs-API", { protected: true }),
  flag("api_documents", "Dokumente-API", "backend", "backend_api", "FileText", "/api/documents", 4, "Dokumenten-API"),
  flag("api_calendar", "Kalender-API", "backend", "backend_api", "Calendar", "/api/calendar", 5, "Kalender-API"),

  // Backend AI Features
  flag("ai_analysis", "KI-Analyse", "backend", "backend_ai", "BarChart3", "/api/ai/analysis", 1, "KI-gestützte Analysen"),
  flag("ai_chat", "KI-Chat", "backend", "backend_ai", "MessageSquare", "/api/ai/chat", 2, "KI-Assistent", { beta: true }),
  flag("ai_recommendations", "KI-Empfehlungen", "backend", "backend_ai", "Lightbulb", "/api/ai/recommendations", 3, "KI-gestützte Empfehlungen", { beta: true }),
  flag("ai_document_analysis", "Dokument-Analyse", "backend", "backend_ai", "FileSearch", "/api/ai/documents", 4, "KI-Dokumentenanalyse", { beta: true }),

  // Backend Integration Features
  flag("integration_email", "E-Mail-Integration", "backend", "backend_integrations", "Mail", "/api/integrations/email", 1, "E-Mail-Verarbeitung"),
  flag("integration_calendar", "Kalender-Sync", "backend", "backend_integrations", "CalendarSync", "/api/integrations/calendar", 2, "Externe Kalender-Synchronisation"),
  flag("integration_stripe", "Stripe-Integration", "backend", "backend_integrations", "CreditCard", "/api/integrations/stripe", 3, "Zahlungsabwicklung"),
  flag("integration_export", "Daten-Export", "backend", "backend_integrations", "Download", "/api/integrations/export", 4, "Daten-Export-Funktionen"),
]

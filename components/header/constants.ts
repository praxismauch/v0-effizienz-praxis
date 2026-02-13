export const pathTitles: Record<string, string> = {
  dashboard: "Dashboard",
  team: "Team",
  goals: "Ziele",
  workflows: "Workflows",
  documents: "Dokumente",
  calendar: "Kalender",
  analytics: "Analysen",
  settings: "Einstellungen",
  profile: "Profil",
  help: "Hilfe",
  contacts: "Kontakte",
  recruiting: "Recruiting",
  tasks: "Aufgaben",
  checklists: "Checklisten",
  "roi-analysis": "ROI Analyse",
  "igel-analysis": "Selbstzahler-Analyse",
  wunschpatient: "Wunschpatient",
  banking: "Banking",
  onboarding: "Onboarding",
  offboarding: "Offboarding",
  "strategy-journey": "Strategiepfad",
  academy: "Effizienz-Academy",
  "competitor-analysis": "Konkurrenzanalyse",
  cockpit: "Cockpit",
  "ai-analysis": "KI-Analyse",
  todos: "Aufgaben",
  responsibilities: "Zuständigkeiten",
  rooms: "Räume",
  skills: "Qualifikationen",
  organigramm: "Organigramm",
  leitbild: "Leitbild",
  arbeitsmittel: "Arbeitsmittel",
  protocols: "Protokolle",
  training: "Schulungen",
  blog: "Blog",
  tickets: "Tickets",
  hiring: "Recruiting",
  candidates: "Kandidaten",
  edit: "Bearbeiten",
  new: "Neu",
  zeiterfassung: "Zeiterfassung",
  dienstplan: "Dienstplan",
  inventory: "Inventar",
}

export type SearchItem = {
  title: string
  description: string
  href: string
  icon: string
  keywords: string[]
}

export const searchableItems: SearchItem[] = [
  { title: "Dashboard", description: "Übersicht und Statistiken", href: "/dashboard", icon: "📊", keywords: ["start", "übersicht", "home", "cockpit"] },
  { title: "Aufgaben", description: "To-dos und Aufgabenverwaltung", href: "/todos", icon: "✅", keywords: ["todo", "tasks", "aufgaben", "erledigen"] },
  { title: "Team", description: "Teammitglieder verwalten", href: "/team", icon: "👥", keywords: ["mitarbeiter", "personal", "kollegen"] },
  { title: "Kalender", description: "Termine und Events", href: "/calendar", icon: "📅", keywords: ["termine", "events", "planung", "datum"] },
  { title: "Dokumente", description: "Dokumentenverwaltung", href: "/documents", icon: "📄", keywords: ["files", "dateien", "unterlagen"] },
  { title: "Analysen", description: "Praxis-Analysen und Reports", href: "/analytics", icon: "📈", keywords: ["statistiken", "reports", "auswertung"] },
  { title: "Einstellungen", description: "Praxis-Einstellungen", href: "/settings", icon: "⚙️", keywords: ["config", "konfiguration", "setup"] },
  { title: "Profil", description: "Ihr Benutzerprofil", href: "/profile", icon: "👤", keywords: ["account", "konto", "benutzer"] },
  { title: "Workflows", description: "Prozesse und Abläufe", href: "/workflows", icon: "🔄", keywords: ["prozesse", "abläufe", "automatisierung"] },
  { title: "Ziele", description: "Praxisziele verwalten", href: "/goals", icon: "🎯", keywords: ["objectives", "targets", "okr"] },
  { title: "Kontakte", description: "Kontaktverwaltung", href: "/contacts", icon: "📇", keywords: ["adressen", "telefon", "email"] },
  { title: "Recruiting", description: "Bewerbungen und Stellen", href: "/hiring", icon: "💼", keywords: ["jobs", "stellen", "bewerbung", "personal"] },
  { title: "Schulungen", description: "Fortbildungen verwalten", href: "/training", icon: "🎓", keywords: ["weiterbildung", "kurse", "fortbildung"] },
  { title: "Academy", description: "Effizienz-Academy", href: "/academy", icon: "📚", keywords: ["lernen", "kurse", "tutorials"] },
  { title: "Protokolle", description: "Sitzungsprotokolle", href: "/protocols", icon: "📝", keywords: ["meetings", "notizen", "sitzungen"] },
  { title: "Nachrichten", description: "Interne Kommunikation", href: "/messages", icon: "💬", keywords: ["chat", "kommunikation", "inbox"] },
  { title: "Zeiterfassung", description: "Arbeitszeiten erfassen", href: "/zeiterfassung", icon: "⏱️", keywords: ["stunden", "arbeitszeit", "tracking"] },
  { title: "Dienstplan", description: "Schichtplanung", href: "/dienstplan", icon: "📋", keywords: ["schichten", "rota", "planung"] },
  { title: "Inventar", description: "Bestandsverwaltung", href: "/inventory", icon: "📦", keywords: ["lager", "bestand", "material"] },
  { title: "Tickets", description: "Support-Anfragen", href: "/tickets", icon: "🎫", keywords: ["support", "hilfe", "anfragen"] },
  { title: "Hilfe", description: "Hilfe und Support", href: "/help", icon: "❓", keywords: ["faq", "support", "anleitung"] },
]

export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

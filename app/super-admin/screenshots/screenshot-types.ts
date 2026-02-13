import { Badge } from "@/components/ui/badge"

export interface ScreenshotRun {
  id: string
  started_at: string
  finished_at: string | null
  status: "running" | "completed" | "failed" | "cancelled"
  total_pages: number
  completed_count: number
  failed_count: number
  viewports: string[]
  base_url: string
  created_at: string
}

export interface ScreenshotResult {
  id: string
  run_id: string
  page_path: string
  page_name: string
  viewport: "desktop" | "tablet" | "mobile"
  status: "pending" | "capturing" | "completed" | "failed"
  image_url: string | null
  error_message: string | null
  captured_at: string | null
  created_at: string
}

export interface ScreenshotConfig {
  baseUrl: string
  viewports: {
    desktop: { width: number; height: number }
    tablet: { width: number; height: number }
    mobile: { width: number; height: number }
  }
}

export const defaultConfig: ScreenshotConfig = {
  baseUrl: typeof window !== "undefined" ? window.location.origin : "",
  viewports: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 812 },
  },
}

export const defaultPages = [
  // Public / Landing Pages
  { path: "/", name: "Landing Page" },
  { path: "/about", name: "Ueber uns" },
  { path: "/pricing", name: "Preise" },
  { path: "/features", name: "Features" },
  { path: "/contact", name: "Kontakt" },
  { path: "/blog", name: "Blog" },
  { path: "/auth/login", name: "Login" },
  { path: "/auth/register", name: "Registrierung" },

  // App - Uebersicht
  { path: "/dashboard", name: "Dashboard" },
  { path: "/analysis", name: "KI-Analyse" },
  { path: "/academy", name: "Academy" },

  // App - Planung & Organisation
  { path: "/calendar", name: "Kalender" },
  { path: "/dienstplan", name: "Dienstplan" },
  { path: "/zeiterfassung", name: "Zeiterfassung" },
  { path: "/todos", name: "Aufgaben" },
  { path: "/goals", name: "Ziele" },
  { path: "/workflows", name: "Workflows" },
  { path: "/responsibilities", name: "Zustaendigkeiten" },

  // App - Daten & Dokumente
  { path: "/analytics", name: "Kennzahlen" },
  { path: "/documents", name: "Dokumente" },
  { path: "/practice-insights", name: "Journal" },
  { path: "/knowledge", name: "Wissen" },
  { path: "/protocols", name: "Protokolle" },
  { path: "/cirs", name: "Verbesserungsmeldung" },

  // App - Qualitaets-Management
  { path: "/hygieneplan", name: "Hygieneplan" },

  // App - Strategie & Fuehrung
  { path: "/strategy-journey", name: "Strategiepfad" },
  { path: "/leadership", name: "Leadership" },
  { path: "/wellbeing", name: "Mitarbeiter-Wellbeing" },
  { path: "/leitbild", name: "Leitbild" },
  { path: "/roi-analysis", name: "Lohnt-es-sich-Analyse" },
  { path: "/igel-analysis", name: "Selbstzahler-Analyse" },
  { path: "/competitor-analysis", name: "Konkurrenzanalyse" },
  { path: "/wunschpatient", name: "Wunschpatient" },

  // App - Team & Personal
  { path: "/hiring", name: "Personalsuche" },
  { path: "/team", name: "Team" },
  { path: "/mitarbeitergespraeche", name: "Mitarbeitergespraeche" },
  { path: "/selbst-check", name: "Selbst-Check" },
  { path: "/skills", name: "Kompetenzen" },
  { path: "/organigramm", name: "Organigramm" },
  { path: "/training", name: "Fortbildung" },

  // App - Praxis & Einstellungen
  { path: "/contacts", name: "Kontakte" },
  { path: "/surveys", name: "Umfragen" },
  { path: "/arbeitsplaetze", name: "Arbeitsplaetze" },
  { path: "/rooms", name: "Raeume" },
  { path: "/arbeitsmittel", name: "Arbeitsmittel" },
  { path: "/inventory", name: "Material" },
  { path: "/devices", name: "Geraete" },
  { path: "/settings", name: "Einstellungen" },

  // Super Admin - Uebersicht
  { path: "/super-admin", name: "SA Dashboard" },

  // Super Admin - Verwaltung
  { path: "/super-admin/tickets", name: "SA Tickets" },
  { path: "/super-admin/verwaltung?tab=practices", name: "SA Praxen" },
  { path: "/super-admin/verwaltung?tab=users", name: "SA Benutzer" },
  { path: "/super-admin/user-rights", name: "SA Benutzerrechte" },
  { path: "/super-admin/kpi-kategorien", name: "SA KPI-Kategorien" },
  { path: "/super-admin/content?tab=skills", name: "SA Vorlagen: Skills" },
  { path: "/super-admin/content?tab=workflows", name: "SA Vorlagen: Workflows" },
  { path: "/super-admin/content?tab=checklisten", name: "SA Vorlagen: Checklisten" },
  { path: "/super-admin/content?tab=dokumente", name: "SA Vorlagen: Dokumente" },
  { path: "/super-admin/content?tab=teams", name: "SA Vorlagen: Teams" },
  { path: "/super-admin/content?tab=event-types", name: "SA Vorlagen: Event-Typen" },

  // Super Admin - Content
  { path: "/super-admin/academy", name: "SA Academy" },
  { path: "/super-admin/waitlist", name: "SA Warteliste" },

  // Super Admin - Finanzen
  { path: "/super-admin/zahlungen", name: "SA Zahlungen" },

  // Super Admin - Management
  { path: "/super-admin/roadmap", name: "SA Roadmap & Ideen" },

  // Super Admin - Marketing
  { path: "/super-admin/social-media", name: "SA Social Media Posts" },

  // Super Admin - Seiten
  { path: "/super-admin/landingpages", name: "SA Landingpages" },

  // Super Admin - Testing
  { path: "/super-admin/testing", name: "SA UI-Tests" },
  { path: "/super-admin/screenshots", name: "SA Screenshots" },

  // Super Admin - System
  { path: "/super-admin/system", name: "SA Systemverwaltung" },
  { path: "/super-admin/features", name: "SA Feature-Verwaltung" },
  { path: "/super-admin/chat-logs", name: "SA Chat-Protokolle" },
  { path: "/super-admin/logging", name: "SA Error Logging" },
  { path: "/super-admin/settings", name: "SA Admin-Einstellungen" },
]

// Helpers

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDuration(start: string, end: string | null) {
  if (!end) return "laufend..."
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

export async function captureScreenshot(
  url: string,
  viewport: string,
  pageName: string,
  practiceId: string = "1"
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const res = await fetch("/api/super-admin/screenshot-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ url, viewport, pageName, practiceId }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || `HTTP ${res.status}` }
    }
    return { success: true, imageUrl: data.imageUrl }
  } catch {
    return { success: false, error: "Screenshot-API nicht erreichbar" }
  }
}

export function statusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed": return "default"
    case "failed": return "destructive"
    case "cancelled": return "outline"
    case "running": return "secondary"
    default: return "outline"
  }
}

import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Define the complete sidebar navigation structure
const getNavigationGroups = () => [
  {
    id: "overview",
    label: "Übersicht",
    items: [
      { name: "Dashboard", href: "/dashboard", key: "dashboard" },
      { name: "KI-Analyse", href: "/analysis", key: "aiAnalysis" },
    ],
  },
  {
    id: "planning",
    label: "Planung & Organisation",
    items: [
      { name: "Kalender", href: "/calendar", key: "calendar" },
      { name: "Aufgaben", href: "/todos", key: "tasks" },
      { name: "Ziele", href: "/goals", key: "goals" },
      { name: "Workflows", href: "/workflows", key: "workflows" },
      { name: "Zuständigkeiten", href: "/responsibilities", key: "responsibilities" },
    ],
  },
  {
    id: "data",
    label: "Daten & Dokumente",
    items: [
      { name: "Auswertung", href: "/analytics", key: "analytics" },
      { name: "Praxis-Journal", href: "/practice-journals", key: "practice-journals" },
      { name: "Dokumente", href: "/documents", key: "documents" },
      { name: "Wissen", href: "/knowledge", key: "knowledge" },
      { name: "Gesprächsprotokoll", href: "/protocols", key: "protocols" },
    ],
  },
  {
    id: "strategy",
    label: "Strategie",
    items: [
      { name: "Strategiepfad", href: "/dashboard/strategy-journey", key: "strategy_journey" },
      { name: "Leitbild", href: "/dashboard/leitbild", key: "leitbild" },
      { name: "Lohnt-es-sich-Analyse", href: "/dashboard/roi-analysis", key: "roi_analysis" },
      { name: "IGEL-Analyse", href: "/dashboard/igel-analysis", key: "igel" },
      { name: "Konkurrenzanalyse", href: "/dashboard/competitor-analysis", key: "competitor_analysis" },
      { name: "Wunschpatient", href: "/dashboard/wunschpatient", key: "wunschpatient" },
    ],
  },
  {
    id: "team-personal",
    label: "Team & Verwaltung",
    items: [
      { name: "Personalsuche", href: "/hiring", key: "hiring" },
      { name: "Team", href: "/team", key: "team" },
      { name: "Skills", href: "/skills", key: "skills", adminOnly: true },
      { name: "Fortbildung", href: "/training", key: "training", adminOnly: true },
      { name: "Profil", href: "/profile", key: "profile" },
      { name: "Einstellungen", href: "/settings", key: "settings" },
      { name: "Kontakte", href: "/contacts", key: "contacts", adminOnly: true },
      { name: "Organigramm", href: "/organigramm", key: "organigramm", adminOnly: true },
      { name: "Arbeitsmittel", href: "/arbeitsmittel", key: "arbeitsmittel", adminOnly: true },
      { name: "Arbeitsplätze", href: "/arbeitsplaetze", key: "arbeitsplaetze", adminOnly: true },
      { name: "Räume", href: "/rooms", key: "rooms", adminOnly: true },
      { name: "Sicherheit", href: "/sicherheit", key: "security", adminOnly: true },
    ],
  },
  {
    id: "marketing",
    label: "Marketing & Bewertungen",
    items: [
      { name: "Bewertungen", href: "/reviews", key: "reviews" },
      { name: "Marketing", href: "/marketing", key: "marketing" },
    ],
  },
]

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { includeAdminOnly = true } = body

    // Get or create category for sidebar navigation tests
    let categoryId: string | null = null

    const { data: existingCategory } = await supabase
      .from("testing_categories")
      .select("id")
      .eq("name", "Sidebar Navigation")
      .single()

    if (existingCategory) {
      categoryId = existingCategory.id
    } else {
      const { data: newCategory, error: categoryError } = await supabase
        .from("testing_categories")
        .insert({
          name: "Sidebar Navigation",
          description: "Tests für alle Sidebar-Menüpunkte und Navigation",
          color: "#6366f1",
          icon: "navigation",
        })
        .select("id")
        .single()

      if (!categoryError && newCategory) {
        categoryId = newCategory.id
      }
    }

    const navigationGroups = getNavigationGroups()
    const templates: Array<{
      title: string
      description: string
      category_id: string | null
      is_active: boolean
      display_order: number
    }> = []

    let displayOrder = 0

    for (const group of navigationGroups) {
      // Add group header template
      templates.push({
        title: `[${group.label}] - Gruppenübersicht`,
        description: `Überprüfen Sie, ob die Gruppe "${group.label}" in der Sidebar sichtbar ist und korrekt angezeigt wird. Die Gruppe sollte expandierbar/kollabierbar sein.`,
        category_id: categoryId,
        is_active: true,
        display_order: displayOrder++,
      })

      // Add individual item templates
      for (const item of group.items) {
        // Skip admin-only items if not included
        if (item.adminOnly && !includeAdminOnly) continue

        const adminNote = item.adminOnly ? " (Nur für Admins sichtbar)" : ""

        templates.push({
          title: `[${group.label}] ${item.name}${adminNote}`,
          description: `Test für Menüpunkt "${item.name}":
1. Überprüfen Sie, ob der Menüpunkt in der Sidebar sichtbar ist${adminNote}
2. Klicken Sie auf "${item.name}" und prüfen Sie, ob die Seite ${item.href} korrekt lädt
3. Prüfen Sie, ob der Menüpunkt als aktiv markiert wird, wenn Sie auf der Seite sind
4. Prüfen Sie die Ladezeit der Seite (sollte < 3 Sekunden sein)
5. Überprüfen Sie, ob alle Hauptelemente der Seite korrekt angezeigt werden`,
          category_id: categoryId,
          is_active: true,
          display_order: displayOrder++,
        })
      }
    }

    // Check for existing templates to avoid duplicates
    const { data: existingTemplates } = await supabase
      .from("test_checklist_templates")
      .select("title")
      .eq("category_id", categoryId)

    const existingTitles = new Set(existingTemplates?.map((t) => t.title) || [])
    const newTemplates = templates.filter((t) => !existingTitles.has(t.title))

    if (newTemplates.length === 0) {
      return NextResponse.json({
        message: "Alle Sidebar-Navigation-Vorlagen existieren bereits",
        created: 0,
        skipped: templates.length,
      })
    }

    // Insert new templates
    const { data: insertedTemplates, error: insertError } = await supabase
      .from("test_checklist_templates")
      .insert(newTemplates)
      .select()

    if (insertError) {
      console.error("[v0] Error inserting sidebar templates:", insertError)
      throw insertError
    }

    return NextResponse.json({
      message: `${newTemplates.length} Sidebar-Navigation-Vorlagen wurden erstellt`,
      created: newTemplates.length,
      skipped: templates.length - newTemplates.length,
      templates: insertedTemplates,
    })
  } catch (error) {
    console.error("[v0] Error generating sidebar test templates:", error)
    return NextResponse.json({ error: "Failed to generate sidebar test templates" }, { status: 500 })
  }
}

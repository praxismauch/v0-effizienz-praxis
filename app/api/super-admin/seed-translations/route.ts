import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

const translations = [
  // Sidebar translations
  { key: "sidebar.dashboard", english: "Dashboard", german: "Dashboard" },
  { key: "sidebar.calendar", english: "Calendar", german: "Kalender" },
  { key: "sidebar.tasks", english: "Tasks", german: "Aufgaben" },
  { key: "sidebar.workflows", english: "Workflows", german: "Workflows" },
  { key: "sidebar.analytics", english: "Analytics", german: "Auswertung" },
  { key: "sidebar.knowledge", english: "Knowledge", german: "Wissen" },
  { key: "sidebar.hiring", english: "Personalsuche", german: "Personalsuche" },
  { key: "sidebar.team", english: "Team", german: "Team" },
  { key: "sidebar.profile", english: "My Profile", german: "Profil" },
  { key: "sidebar.settings", english: "Settings", german: "Einstellungen" },
  { key: "sidebar.superAdmin", english: "Super Admin", german: "Super Admin" },
  { key: "sidebar.role.superadmin", english: "Super Administrator", german: "Super Administrator" },
  { key: "sidebar.role.admin", english: "Administrator", german: "Administrator" },
  { key: "sidebar.role.doctor", english: "Doctor", german: "Arzt" },
  { key: "sidebar.documents", english: "Documents", german: "Dokumente" },
]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    console.log(`[v0] Seeding ${translations.length} translations...`)

    let successCount = 0
    let errorCount = 0

    for (const translation of translations) {
      const { error } = await supabase.from("translations").upsert(
        {
          key: translation.key,
          english: translation.english,
          german: translation.german,
          category: (translation as any).category || "general",
        },
        {
          onConflict: "key",
        },
      )

      if (error) {
        console.error(`[v0] Error seeding translation ${translation.key}:`, error)
        errorCount++
      } else {
        successCount++
      }
    }

    console.log(`[v0] Translation seeding complete! Success: ${successCount}, Errors: ${errorCount}`)

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${successCount} translations${errorCount > 0 ? ` (${errorCount} errors)` : ""}`,
      details: {
        total: translations.length,
        successCount,
        errorCount,
      },
    })
  } catch (error) {
    console.error("[v0] Error in seed translations API:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

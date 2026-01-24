import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()

  try {
    const supabase = await createServerClient(cookieStore)

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    // Check if super admin
    const { data: userData } = await supabase.from("users").select("is_super_admin").eq("id", user.id).single()

    if (!userData?.is_super_admin) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
    }

    // Get practice information for context
    const { data: practices } = await supabase.from("practices").select("name, specialty").limit(5)

    const practiceContext =
      practices?.map((p) => `${p.name} (${p.specialty || "Allgemeinmedizin"})`).join(", ") || "Allgemeine Arztpraxis"

    // Generate AI keyword suggestions
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `Du bist ein SEO-Experte für medizinische Praxen in Deutschland.

Kontext: Die Anwendung ist eine Praxismanagement-Software für: ${practiceContext}

Generiere 15 relevante SEO-Keywords für diese Praxen, die:
- Spezifisch für die medizinische Branche sind
- Lokale Suchintention berücksichtigen (z.B. "Arzt München", "Praxis Berlin")
- Dienstleistungen und Fachgebiete abdecken
- Verschiedene Suchintentionen abbilden (informativ, transaktional, lokal)
- Im deutschen Sprachraum relevant sind

Gib nur die Keywords zurück, getrennt durch Zeilenumbrüche, ohne Nummerierung oder zusätzlichen Text.`,
    })

    // Parse the keywords from the response
    const suggestions = text
      .split("\n")
      .map((k) => k.trim())
      .filter((k) => k.length > 0 && !k.match(/^\d+\./))
      .slice(0, 15)

    return NextResponse.json({
      suggestions,
      success: true,
    })
  } catch (error) {
    console.error("[v0] Error generating AI keywords:", error)
    return NextResponse.json({ error: "Fehler beim Generieren der Keywords" }, { status: 500 })
  }
}

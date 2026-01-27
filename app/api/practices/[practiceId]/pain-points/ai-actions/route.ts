import { createAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { streamText } from "ai"

interface PainPoint {
  id: string
  title: string
  description: string
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const adminClient = await createAdminClient()

    // Get practice with pain points
    const { data: practice, error: practiceError } = await adminClient
      .from("practices")
      .select("name, type, settings")
      .eq("id", practiceId)
      .single()

    if (practiceError || !practice) {
      return NextResponse.json({ error: "Praxis nicht gefunden" }, { status: 404 })
    }

    const painPoints: PainPoint[] = practice.settings?.painPoints || []

    if (painPoints.length === 0) {
      return NextResponse.json({ error: "Keine Herausforderungen definiert" }, { status: 400 })
    }

    const painPointsText = painPoints
      .map((p, i) => `${i + 1}. ${p.title}${p.description ? `: ${p.description}` : ""}`)
      .join("\n")

    const result = await streamText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: `Du bist ein erfahrener Praxisberater für medizinische Einrichtungen in Deutschland. 
Du hilfst Praxen dabei, ihre größten Herausforderungen zu lösen.

Deine Aufgabe ist es, für die genannten Probleme konkrete, umsetzbare Maßnahmen zu erstellen.

Antworte IMMER im folgenden JSON-Format:
{
  "actionItems": [
    {
      "id": "1",
      "painPointId": "1",
      "painPointTitle": "Titel des Problems",
      "title": "Kurzer, prägnanter Maßnahmentitel",
      "description": "Detaillierte Beschreibung der Maßnahme",
      "priority": "high" | "medium" | "low",
      "category": "prozesse" | "team" | "technologie" | "kommunikation" | "organisation",
      "estimatedEffort": "gering" | "mittel" | "hoch",
      "expectedImpact": "Erwarteter Nutzen",
      "steps": ["Schritt 1", "Schritt 2", "Schritt 3"]
    }
  ]
}

Erstelle genau 10 Maßnahmen, verteilt auf alle genannten Probleme.
Priorisiere nach Dringlichkeit und Umsetzbarkeit.
Alle Texte auf Deutsch.`,
      prompt: `Die Praxis "${practice.name}" (Typ: ${practice.type || "Allgemeine Praxis"}) hat folgende Herausforderungen genannt:

${painPointsText}

Erstelle 10 konkrete, umsetzbare Maßnahmen, um diese Probleme zu lösen. 
Verteile die Maßnahmen sinnvoll auf alle genannten Probleme.
Berücksichtige dabei die Realitäten einer deutschen Arztpraxis.`,
    })

    // Collect the full response
    let fullText = ""
    for await (const chunk of result.textStream) {
      fullText += chunk
    }

    // Parse JSON from response
    try {
      const jsonMatch = fullText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])

        // Save to practice settings
        const updatedSettings = {
          ...practice.settings,
          aiActionItems: parsed.actionItems,
          aiActionItemsGeneratedAt: new Date().toISOString(),
        }

        await adminClient.from("practices").update({ settings: updatedSettings }).eq("id", practiceId)

        return NextResponse.json(parsed)
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
    }

    return NextResponse.json({ error: "Fehler bei der KI-Analyse" }, { status: 500 })
  } catch (error) {
    console.error("Error generating AI actions:", error)
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { generateText } from "ai"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {

    const body = await request.json()

    const {
      name,
      description,
      group_name,
      suggested_hours_per_week,
      estimated_time_amount,
      estimated_time_period,
      cannot_complete_during_consultation,
      practice_id,
    } = body

    if (!name) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("[v0] OPENAI_API_KEY is not configured")
      return NextResponse.json(
        {
          error: "KI-Service ist nicht konfiguriert. Bitte OpenAI API-Schlüssel hinzufügen.",
        },
        { status: 500 },
      )
    }

    // Get practice context if practice_id is provided
    let practiceContext = ""
    if (practice_id) {
      const supabase = await createServerClient()
      
      // Try to get practice with description, fallback without if column doesn't exist
      let practice: any = null
      const result = await supabase
        .from("practices")
        .select("name, description, specialty")
        .eq("id", practice_id)
        .single()
      
      if (result.error && (result.error.code === '42703' || result.error.code === 'PGRST204') && 
          result.error.message.includes('description')) {
        // Fallback: get practice without description column
        const fallbackResult = await supabase
          .from("practices")
          .select("name, specialty")
          .eq("id", practice_id)
          .single()
        practice = fallbackResult.data
      } else if (result.error) {
      } else {
        practice = result.data
      }

      if (practice) {
        practiceContext = `
Praxiskontext:
- Name: ${practice.name}
- Beschreibung: ${practice.description || "Nicht angegeben"}
- Fachrichtung: ${practice.specialty || "Nicht angegeben"}
`
      }
    }

    const timeInfo =
      estimated_time_amount && estimated_time_period
        ? `${estimated_time_amount} Stunden pro ${estimated_time_period}`
        : suggested_hours_per_week
          ? `${suggested_hours_per_week} Stunden pro Woche`
          : "Nicht angegeben"

    const prompt = `Du bist ein Experte für Praxisoptimierung und Prozessverbesserung im medizinischen Bereich.

${practiceContext}

Analysiere die folgende Zuständigkeit und gib konkrete, umsetzbare Optimierungsvorschläge:

Zuständigkeit: ${name}
${description ? `Beschreibung: ${description}` : ""}
${group_name ? `Kategorie: ${group_name}` : ""}
Geschätzter Zeitaufwand: ${timeInfo}
${cannot_complete_during_consultation ? "⚠️ Kann NICHT während der Sprechstunde erledigt werden" : "✓ Kann während der Sprechstunde erledigt werden"}

Bitte gib 3-5 konkrete Optimierungsvorschläge, die helfen:
1. Zeit zu sparen
2. Qualität zu verbessern
3. Fehler zu reduzieren
4. Mitarbeiter zu entlasten
5. Prozesse zu digitalisieren oder zu automatisieren

Formatiere deine Antwort als nummerierte Liste mit klaren, umsetzbaren Vorschlägen. Sei spezifisch und praxisnah.`

    try {
      const { text } = await generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        prompt,
        maxOutputTokens: 1000,
      })

      return NextResponse.json({ suggestions: text })
    } catch (aiError) {
      console.error("[v0] AI generation error:", aiError)
      const aiErrorMessage = aiError instanceof Error ? aiError.message : "Unknown AI error"
      return NextResponse.json(
        {
          error: "KI-Generierung fehlgeschlagen",
          details: aiErrorMessage,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Error generating optimization suggestions:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: "Fehler beim Generieren der Optimierungsvorschläge",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

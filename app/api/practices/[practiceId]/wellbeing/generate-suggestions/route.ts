import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateObject } from "ai"
import { z } from "zod"

const suggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      category: z.enum([
        "work_life_balance",
        "stress_reduction",
        "team_building",
        "communication",
        "recognition",
        "flexibility",
        "health",
        "growth",
      ]),
      title: z.string(),
      description: z.string(),
      effort_level: z.enum(["low", "medium", "high"]),
      impact_level: z.enum(["low", "medium", "high"]),
      estimated_cost: z.string(),
      implementation_tips: z.array(z.string()),
    }),
  ),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  const { practiceId } = await params
  const supabase = await createClient()
  
  let body
  try {
    body = await request.json()
  } catch (error) {
    console.error("Error parsing request body:", error)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  console.log("[v0] Generating suggestions for practice:", practiceId)
  console.log("[v0] Mood averages:", body.mood_averages)
  console.log("[v0] Workload analysis:", body.workload_analysis)

  try {
    const { object } = await generateObject({
      model: "openai/gpt-4o",
      schema: suggestionSchema,
      prompt: `Generiere 5 konkrete Wellbeing-Maßnahmen für ein Arztpraxis-Team basierend auf diesen Daten:

${
  body.mood_averages
    ? `Stimmungs-Durchschnitte:
- Arbeitszufriedenheit: ${body.mood_averages.work_satisfaction?.toFixed(1) || "N/A"}/5
- Stress-Level: ${body.mood_averages.stress_level?.toFixed(1) || "N/A"}/5
- Work-Life-Balance: ${body.mood_averages.work_life_balance?.toFixed(1) || "N/A"}/5
- Team-Harmonie: ${body.mood_averages.team_harmony?.toFixed(1) || "N/A"}/5`
    : "Keine Stimmungsdaten verfügbar"
}

${
  body.workload_analysis
    ? `Arbeitsbelastungs-Analyse:
- Burnout-Risiko: ${body.workload_analysis.burnout_risk_score}%
- Ø Wochenstunden: ${body.workload_analysis.avg_weekly_hours?.toFixed(1) || "N/A"}h
- Überstundenquote: ${body.workload_analysis.overtime_percentage?.toFixed(0) || "N/A"}%
- Risikofaktoren: ${body.workload_analysis.risk_factors?.join(", ") || "Keine"}`
    : "Keine Arbeitsbelastungs-Daten verfügbar"
}

Generiere praktische, umsetzbare Maßnahmen für eine Arztpraxis. Berücksichtige:
- Verschiedene Aufwand- und Wirkungsstufen
- Mix aus kostenlosen und kostenpflichtigen Optionen
- Kurzfristige Quick-Wins und langfristige Strategien
- Spezifische Tipps für die Umsetzung

Antworte auf Deutsch.`,
    })

    // Save suggestions to database
    const suggestionsToInsert = object.suggestions.map((s) => ({
      practice_id: practiceId,
      ...s,
    }))

    console.log("[v0] Generated suggestions:", object.suggestions)

    const { data: savedSuggestions, error } = await supabase
      .from("wellbeing_suggestions")
      .insert(suggestionsToInsert)
      .select()

    if (error) {
      console.error("[v0] Error saving suggestions to database:", error)
      throw error
    }

    console.log("[v0] Saved suggestions to database:", savedSuggestions)
    return NextResponse.json({ suggestions: savedSuggestions })
  } catch (error) {
    console.error("[v0] Error generating suggestions:", error)
    return NextResponse.json(
      { 
        error: "Failed to generate suggestions",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

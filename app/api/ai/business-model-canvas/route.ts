import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { prompt, currentCanvas } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 })
    }

    const systemPrompt = `Du bist ein Business Strategy Experte, spezialisiert auf das Business Model Canvas Framework.
Du analysierst das aktuelle Business Model Canvas einer Praxismanagement-Software und generierst konkrete, umsetzbare Vorschläge.

Aktuelles Canvas:
${JSON.stringify(currentCanvas, null, 2)}

Basierend auf der Benutzeranfrage, generiere spezifische Vorschläge für die relevanten Sektionen des Business Model Canvas.

Antworte NUR mit einem JSON-Objekt in folgendem Format:
{
  "suggestions": {
    "key-partners": ["Vorschlag 1", "Vorschlag 2"],
    "key-activities": ["Vorschlag 1"],
    "key-resources": [],
    "value-propositions": ["Vorschlag 1", "Vorschlag 2", "Vorschlag 3"],
    "customer-relationships": [],
    "channels": ["Vorschlag 1"],
    "customer-segments": [],
    "cost-structure": [],
    "revenue-streams": ["Vorschlag 1"]
  }
}

Regeln:
- Nur Sektionen mit relevanten Vorschlägen füllen
- Maximal 3 Vorschläge pro Sektion
- Vorschläge müssen konkret und umsetzbar sein
- Auf Deutsch antworten
- Fokus auf Healthcare/Praxismanagement-Branche`

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: systemPrompt,
      prompt: prompt,
    })

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid AI response format")
    }

    const suggestions = JSON.parse(jsonMatch[0])

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error("Business Model Canvas AI error:", error)
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}

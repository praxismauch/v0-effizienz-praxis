import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { existingCategories } = await request.json()

    const prompt = `Du bist ein Experte für Softwaretest-Management. 

Bestehende Test-Kategorien: ${existingCategories.length > 0 ? existingCategories.join(", ") : "Keine"}

Generiere 5-7 sinnvolle und häufig verwendete Test-Kategorien für eine Praxismanagement Software, die noch nicht in der Liste sind.

Kategorien sollten verschiedene Aspekte abdecken wie:
- Funktionale Bereiche (z.B. Frontend, Backend, API)
- Qualitätsaspekte (z.B. Sicherheit, Performance, Usability)
- Technische Bereiche (z.B. Datenbank, Integration, Deployment)

Gib die Antwort als JSON-Array zurück mit diesem Format:
[
  {
    "name": "Kategoriename",
    "description": "Kurze Beschreibung was getestet wird",
    "color": "#hexcolor"
  }
]

Verwende verschiedene, gut lesbare Farben für jede Kategorie.
WICHTIG: Gib NUR das JSON-Array zurück, ohne zusätzlichen Text oder Markdown-Formatierung.`

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("[v0] OPENAI_API_KEY not configured")
      return NextResponse.json(
        { error: "AI service not configured. Please add OPENAI_API_KEY to environment variables." },
        { status: 500 },
      )
    }

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
    })

    let suggestions
    try {
      // Try to parse the entire text as JSON first
      suggestions = JSON.parse(text)
    } catch {
      // If that fails, try to extract JSON array from the text
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.error("[v0] Could not find JSON array in response:", text.substring(0, 200))
        throw new Error("Keine gültige JSON-Antwort erhalten")
      }
      suggestions = JSON.parse(jsonMatch[0])
    }

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      console.error("[v0] Invalid suggestions format:", suggestions)
      throw new Error("Ungültiges Format der KI-Antwort")
    }

    // Validate each suggestion has required fields
    const validSuggestions = suggestions.filter((s) => s.name && typeof s.name === "string" && s.description && s.color)

    if (validSuggestions.length === 0) {
      console.error("[v0] No valid suggestions found")
      throw new Error("Keine gültigen Vorschläge erhalten")
    }

    return NextResponse.json({ suggestions: validSuggestions })
  } catch (error) {
    console.error("[v0] Error generating AI suggestions:", error)
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"
    return NextResponse.json({ error: "Failed to generate suggestions", details: errorMessage }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { specialty, templateName } = body

    const prompt = `Du bist ein Experte für Personalmanagement in medizinischen Praxen. Generiere eine Liste von 8-12 Skills für eine ${specialty || "Allgemeinmedizinische"} Praxis mit dem Namen "${templateName || "Neue Vorlage"}".

Für jeden Skill benötige ich:
- name: Ein prägnanter Skill-Name
- category: Eine Kategorie (z.B. "Medizinische Kompetenz", "Verwaltung", "Kommunikation", "Technik", "Hygiene")
- description: Kurze Beschreibung des Skills
- color: Eine Hex-Farbe passend zur Kategorie (#3b82f6 für blau, #10b981 für grün, #f59e0b für orange, #8b5cf6 für lila, #ec4899 für pink, #ef4444 für rot)

Für jeden Skill definiere 4 Stufen (0-3) mit:
- level_X_title: Titel der Stufe
- level_X_description: Beschreibung was jemand auf dieser Stufe können muss
- level_X_criteria: Array von 2-3 beobachtbaren, messbaren Kriterien

Die Stufen sind:
- Level 0: Kein Skill - Keine Erfahrung, benötigt vollständige Anleitung
- Level 1: Basis - Kann einfache Aufgaben mit Anleitung ausführen
- Level 2: Selbstständig - Beherrscht Aufgaben sicher und zuverlässig ohne Hilfe  
- Level 3: Experte - Beherrscht komplexe Situationen, kann andere anleiten, optimiert Prozesse

Die Kriterien müssen klar, beobachtbar und messbar sein.

Antworte NUR mit einem validen JSON-Array ohne weitere Erklärungen.`

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4",
      prompt,
      maxTokens: 4000,
    })

    // Parse the response
    let skills
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanText = text.trim()
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.slice(7)
      }
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.slice(3)
      }
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.slice(0, -3)
      }
      skills = JSON.parse(cleanText.trim())
    } catch (parseError) {
      console.error("[v0] Failed to parse AI response:", text)
      return NextResponse.json({ error: "KI-Antwort konnte nicht verarbeitet werden" }, { status: 500 })
    }

    return NextResponse.json({ skills })
  } catch (error) {
    console.error("[v0] Generate skills error:", error)
    return NextResponse.json({ error: "Fehler bei der KI-Generierung" }, { status: 500 })
  }
}

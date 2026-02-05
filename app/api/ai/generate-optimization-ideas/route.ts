import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json()

    if (!title && !content) {
      return NextResponse.json({ error: "Titel oder Inhalt erforderlich" }, { status: 400 })
    }

    const prompt = `Du bist ein Experte für Prozessoptimierung. Analysiere das folgende Popup und generiere konkrete, umsetzbare Optimierungsideen.

Titel: ${title}
Inhalt: ${content}

Generiere 3-5 konkrete Optimierungsvorschläge, die den Prozess verbessern könnten. Fokussiere dich auf:
- Benutzerfreundlichkeit
- Conversion-Optimierung
- Klarheit der Botschaft
- Design-Verbesserungen
- Timing und Platzierung

Antworte auf Deutsch in klaren, umsetzbaren Punkten.`

    const { text } = await generateText({
      model: "anthropic/claude-3-5-sonnet-20241022",
      prompt,
    })

    return NextResponse.json({
      optimizationIdeas: text,
    })
  } catch (error) {
    console.error("[v0] Error generating optimization ideas:", error)
    return NextResponse.json({ error: "Fehler beim Generieren der Optimierungsideen" }, { status: 500 })
  }
}

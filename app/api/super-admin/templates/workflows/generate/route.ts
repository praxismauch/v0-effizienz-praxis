import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, category } = body

    if (!description || description.trim().length < 10) {
      return NextResponse.json(
        { error: "Bitte geben Sie eine detailliertere Beschreibung ein (mindestens 10 Zeichen)." },
        { status: 400 },
      )
    }

    const prompt = `Du bist ein Experte für Prozessoptimierung in medizinischen Praxen. Erstelle eine Workflow-Vorlage basierend auf folgender Beschreibung:

"${description}"

${category ? `Kategorie: ${category}` : ""}

Generiere einen strukturierten Workflow mit:
- name: Ein prägnanter Name für den Workflow (max 80 Zeichen)
- description: Eine kurze Beschreibung des Workflows (1-2 Sätze)
- steps: Ein Array von 4-8 Schritten, jeder Schritt hat:
  - title: Kurzer Titel des Schritts
  - description: Was in diesem Schritt zu tun ist
  - assignedTo: Wer zuständig ist (z.B. "MFA", "Arzt", "Rezeption", "Labor")
  - estimatedDuration: Geschätzte Dauer in Minuten (Ganzzahl)
  - dependencies: Leeres Array []

Die Schritte sollten in logischer Reihenfolge sein und einen vollständigen Arbeitsablauf abbilden.

Antworte NUR mit einem validen JSON-Objekt ohne weitere Erklärungen. Format:
{
  "name": "...",
  "description": "...",
  "steps": [...]
}`

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
      maxOutputTokens: 2000,
    })

    let workflow
    try {
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
      workflow = JSON.parse(cleanText.trim())
    } catch {
      console.error("[v0] Failed to parse AI workflow response:", text)
      return NextResponse.json({ error: "KI-Antwort konnte nicht verarbeitet werden" }, { status: 500 })
    }

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error("[v0] Generate workflow error:", error)
    return NextResponse.json({ error: "Fehler bei der KI-Generierung" }, { status: 500 })
  }
}

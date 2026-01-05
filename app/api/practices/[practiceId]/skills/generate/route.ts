import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const body = await request.json()
    const { practiceType, skillName, category } = body

    const prompt = `Du bist ein Experte für Kompetenzmanagement in medizinischen Praxen.
Erstelle für den Skill "${skillName}" in der Kategorie "${category}" für eine ${practiceType}-Praxis
detaillierte Level-Definitionen mit klaren, beobachtbaren und messbaren Kriterien.

Antworte im folgenden JSON-Format:
{
  "description": "Kurze Beschreibung des Skills",
  "level_0_title": "Kein Skill",
  "level_0_description": "Beschreibung für Level 0",
  "level_0_criteria": ["Kriterium 1", "Kriterium 2", "Kriterium 3"],
  "level_1_title": "Basis",
  "level_1_description": "Beschreibung für Level 1",
  "level_1_criteria": ["Kriterium 1", "Kriterium 2", "Kriterium 3"],
  "level_2_title": "Selbstständig",
  "level_2_description": "Beschreibung für Level 2",
  "level_2_criteria": ["Kriterium 1", "Kriterium 2", "Kriterium 3"],
  "level_3_title": "Experte",
  "level_3_description": "Beschreibung für Level 3",
  "level_3_criteria": ["Kriterium 1", "Kriterium 2", "Kriterium 3"]
}

Die Kriterien müssen:
- Klar und eindeutig sein
- Beobachtbar sein (man kann sehen, ob jemand das kann)
- Messbar sein (man kann es bewerten)
- Aufeinander aufbauen (höhere Level beinhalten niedrigere)

Antworte nur mit dem JSON, ohne zusätzlichen Text.`

    const result = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
      maxTokens: 2000,
    })

    try {
      const parsed = JSON.parse(result.text)
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({ error: "KI-Antwort konnte nicht verarbeitet werden" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[v0] Skill generate error:", error)

    if (error?.message?.includes("Not authenticated") || error?.message?.includes("401")) {
      return NextResponse.json({ error: "KI-Service nicht verfügbar" }, { status: 503 })
    }

    return NextResponse.json({ error: "Fehler bei der KI-Generierung" }, { status: 500 })
  }
}

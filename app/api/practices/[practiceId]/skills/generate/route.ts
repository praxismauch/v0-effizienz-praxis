import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    await params
    const body = await request.json()

    // Support both bulk generation (prompt) and single skill level generation (skillName)
    if (body.prompt) {
      return handleBulkGenerate(body.prompt)
    } else if (body.skillName) {
      return handleSingleGenerate(body)
    }

    return NextResponse.json({ error: "Missing prompt or skillName" }, { status: 400 })
  } catch (error: any) {
    console.error("Skill generate error:", error)
    if (error?.message?.includes("Not authenticated") || error?.message?.includes("401")) {
      return NextResponse.json({ error: "KI-Service nicht verfügbar" }, { status: 503 })
    }
    return NextResponse.json({ error: "Fehler bei der KI-Generierung" }, { status: 500 })
  }
}

async function handleBulkGenerate(prompt: string) {
  if (prompt.trim().length < 3) {
    return NextResponse.json({ error: "Bitte geben Sie eine detailliertere Beschreibung ein." }, { status: 400 })
  }

  const { text } = await generateText({
    model: "anthropic/claude-sonnet-4-20250514",
    system: `Du bist ein Experte für Kompetenzmanagement in medizinischen Praxen in Deutschland.
Generiere eine Liste relevanter Kompetenzen basierend auf der Beschreibung der Praxis.

Antworte NUR mit einem validen JSON-Objekt im folgenden Format:
{
  "skills": [
    {
      "name": "Name der Kompetenz",
      "description": "Kurze Beschreibung",
      "category": "medical" oder "administrative" oder "communication" oder "technical" oder "leadership" oder "soft_skills" oder "quality" oder "hygiene" oder "emergency" oder "other",
      "level_0_description": "Keine Erfahrung - was das konkret bedeutet",
      "level_1_description": "Grundkenntnisse - was die Person kann",
      "level_2_description": "Fortgeschritten - was die Person beherrscht",
      "level_3_description": "Experte - was die Person auszeichnet"
    }
  ]
}

Generiere 8-15 relevante Kompetenzen für die beschriebene Praxis.
Verwende verschiedene Kategorien. Alle Texte müssen auf Deutsch sein.
Die Level-Beschreibungen sollen spezifisch und praxisrelevant sein.`,
    prompt: `Generiere Kompetenzen für folgende Praxis: ${prompt}`,
    maxOutputTokens: 4000,
  })

  let result
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found")
    result = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: "Die KI-Antwort konnte nicht verarbeitet werden." }, { status: 500 })
  }

  return NextResponse.json({ skills: result.skills || [] })
}

async function handleSingleGenerate(body: { practiceType: string; skillName: string; category: string }) {
  const { practiceType, skillName, category } = body

  const { text } = await generateText({
    model: "anthropic/claude-sonnet-4-20250514",
    prompt: `Du bist ein Experte für Kompetenzmanagement in medizinischen Praxen.
Erstelle für den Skill "${skillName}" in der Kategorie "${category}" für eine ${practiceType}-Praxis
detaillierte Level-Definitionen mit klaren, beobachtbaren und messbaren Kriterien.

Antworte im folgenden JSON-Format:
{
  "description": "Kurze Beschreibung des Skills",
  "level_0_description": "Beschreibung für Level 0",
  "level_1_description": "Beschreibung für Level 1",
  "level_2_description": "Beschreibung für Level 2",
  "level_3_description": "Beschreibung für Level 3"
}

Antworte nur mit dem JSON, ohne zusätzlichen Text.`,
    maxOutputTokens: 2000,
  })

  try {
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: "KI-Antwort konnte nicht verarbeitet werden" }, { status: 500 })
  }
}

import { generateText } from "ai"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { description, category, difficulty } = body

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    const prompt = `Du bist ein Experte für die Erstellung von Online-Kursen für medizinische Praxen und Gesundheitseinrichtungen.

Erstelle einen vollständigen Kurs basierend auf folgender Beschreibung:
"${description}"

Kategorie: ${category || "Allgemein"}
Schwierigkeitsgrad: ${difficulty || "Anfänger"}

Generiere ein JSON-Objekt mit folgender Struktur:
{
  "title": "Kurstitel (kurz und prägnant)",
  "description": "Ausführliche Kursbeschreibung (2-3 Sätze)",
  "learning_objectives": ["Lernziel 1", "Lernziel 2", "Lernziel 3"],
  "target_audience": "Zielgruppe des Kurses",
  "estimated_hours": Geschätzte Dauer in Stunden (Zahl),
  "xp_reward": XP-Belohnung (Zahl zwischen 100-500),
  "instructor_name": "Name des virtuellen Dozenten",
  "instructor_bio": "Kurze Bio des Dozenten",
  "modules": [
    {
      "title": "Modultitel",
      "description": "Modulbeschreibung",
      "estimated_minutes": Geschätzte Dauer in Minuten (Zahl),
      "lessons": [
        {
          "title": "Lektionstitel",
          "description": "Lektionsbeschreibung",
          "content": "Ausführlicher Inhalt der Lektion (mindestens 200 Wörter)",
          "lesson_type": "text",
          "estimated_minutes": Geschätzte Dauer in Minuten (Zahl),
          "xp_reward": XP-Belohnung (Zahl zwischen 10-50)
        }
      ]
    }
  ]
}

Wichtige Regeln:
- Erstelle 2-4 Module mit jeweils 2-4 Lektionen
- Alle Texte auf Deutsch
- Praxisbezogene, anwendbare Inhalte
- Medizinisch korrekt und aktuell
- Für Praxispersonal verständlich

Antworte NUR mit dem JSON-Objekt, ohne zusätzlichen Text.`

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
      maxTokens: 4000,
    })

    // Parse the JSON response
    let courseData
    try {
      // Remove any markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
      courseData = JSON.parse(cleanedText)
    } catch {
      console.error("[v0] Failed to parse AI response:", text)
      return NextResponse.json({ error: "Fehler beim Parsen der KI-Antwort" }, { status: 500 })
    }

    return NextResponse.json({ course: courseData })
  } catch (error) {
    console.error("[v0] Error generating course:", error)
    return NextResponse.json({ error: "Fehler beim Generieren des Kurses" }, { status: 500 })
  }
}

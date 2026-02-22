import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { currentVersion, changeList } = body

    if (!changeList || !Array.isArray(changeList) || changeList.length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 })
    }

    const prompt = `Du bist ein technischer Redakteur für ein medizinisches Praxis-Management-SaaS namens "Effizienz Praxis".
Analysiere die folgenden Änderungen und erstelle einen professionellen, strukturierten Changelog-Eintrag auf Deutsch.

Aktuelle Version: ${currentVersion || "nicht angegeben"}

Rohe Änderungsliste:
${changeList.map((change: string, idx: number) => `${idx + 1}. ${change}`).join("\n")}

Regeln:
- Kategorisiere jede Änderung in die passende Kategorie: "Neue Funktionen", "Verbesserungen", "Fehlerbehebungen", "Sicherheit", oder "Sonstiges"
- Formuliere jede Änderung professionell und klar verständlich für Praxis-Mitarbeiter
- Der Titel soll kurz und prägnant sein (z.B. "Optimiertes Dashboard & neue KI-Funktionen")
- Die Beschreibung soll 2-3 Sätze lang sein und den Mehrwert für den Nutzer hervorheben
- Schlage eine passende Versionsnummer vor (semver)
- Bestimme ob es major/minor/patch ist

Antworte NUR mit einem validen JSON-Objekt in exakt diesem Format:
{
  "title": "Release-Titel hier",
  "description": "Kurze Beschreibung hier (2-3 Saetze)",
  "changes": [
    {
      "category": "Neue Funktionen",
      "items": ["Beschreibung der Funktion 1", "Beschreibung der Funktion 2"]
    },
    {
      "category": "Verbesserungen",
      "items": ["Beschreibung der Verbesserung 1"]
    }
  ],
  "suggestedVersion": "1.2.0",
  "change_type": "minor"
}`

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
    })

    // Parse the AI response - extract JSON from the text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("AI response did not contain valid JSON")
    }

    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error generating AI changelog:", error)
    return NextResponse.json(
      { error: "KI-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut." },
      { status: 500 }
    )
  }
}

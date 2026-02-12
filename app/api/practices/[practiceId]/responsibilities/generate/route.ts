import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> },
) {
  try {
    const { practiceId } = await params
    const { practiceType, teamSize, additionalContext } = await request.json()

    let responsibilitiesData

    try {
      const prompt = `Du bist ein Experte für Praxismanagement und Aufgabenverteilung in medizinischen Einrichtungen.

Kontext:
- Praxis-ID: ${practiceId}
- Praxistyp: ${practiceType || "Medizinische Praxis"}
- Teamgröße: ${teamSize || "Nicht angegeben"}
${additionalContext ? `- Zusätzlicher Kontext: ${additionalContext}` : ""}

Erstelle 3-5 verschiedene Zuständigkeiten (Verantwortlichkeiten) für diese Praxis. Jede Zuständigkeit sollte einen wichtigen Bereich der Praxisorganisation abdecken.

Antworte ausschließlich mit einem JSON-Array in folgendem Format (ohne Markdown, nur reines JSON):
[
  {
    "name": "Kurzer, prägnanter Name der Zuständigkeit (max 60 Zeichen)",
    "description": "Detaillierte Beschreibung der Aufgaben und Verantwortlichkeiten (2-3 Sätze)",
    "group_name": "Kategorie (z.B. 'Verwaltung', 'Patientenversorgung', 'Qualität', 'Organisation')",
    "reasoning": "Kurze Erklärung, warum diese Zuständigkeit wichtig ist"
  }
]`

      const { text } = await generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        prompt,
        temperature: 0.7,
        maxOutputTokens: 2000,
      })

      const cleanedText = text.trim().replace(/```json\n?|\n?```/g, "")
      responsibilitiesData = JSON.parse(cleanedText)
    } catch (aiError) {
      console.error("[v0] AI generation failed, using fallback:", aiError)
      responsibilitiesData = [
        {
          name: "Patientenaufnahme und -verwaltung",
          description: "Verantwortlich für die Aufnahme neuer Patienten, Pflege der Patientendaten und Terminvergabe.",
          group_name: "Patientenversorgung",
          reasoning: "Strukturierte Patientenaufnahme ist essentiell für einen reibungslosen Ablauf.",
        },
        {
          name: "Abrechnung und Finanzverwaltung",
          description: "Zuständig für die korrekte Abrechnung von Leistungen, Rechnungsstellung und Mahnwesen.",
          group_name: "Verwaltung",
          reasoning: "Eine saubere Abrechnung sichert die finanzielle Basis der Praxis.",
        },
        {
          name: "Qualitätsmanagement und Dokumentation",
          description: "Verantwortlich für die Einhaltung von Qualitätsstandards und Dokumentation von Prozessen.",
          group_name: "Qualität",
          reasoning: "Qualitätsmanagement gewährleistet hohe Standards und erfüllt gesetzliche Anforderungen.",
        },
        {
          name: "Hygiene und Materialverwaltung",
          description: "Zuständig für die Einhaltung der Hygienevorschriften und Bestellung von Verbrauchsmaterialien.",
          group_name: "Organisation",
          reasoning: "Hygiene und Materialverfügbarkeit sind grundlegend für den Praxisbetrieb.",
        },
      ]
    }

    return NextResponse.json({ responsibilities: responsibilitiesData })
  } catch (error) {
    console.error("[v0] Error generating responsibilities:", error)
    return NextResponse.json({ error: "Fehler beim Generieren der Zuständigkeiten" }, { status: 500 })
  }
}

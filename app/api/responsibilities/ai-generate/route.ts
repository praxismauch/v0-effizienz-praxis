import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { practiceType, context, teamSize } = await request.json()

    let responsibilitiesData

    try {

      const prompt = `Du bist ein Experte für Praxismanagement und Aufgabenverteilung in medizinischen Einrichtungen.

Kontext:
- Praxistyp: ${practiceType || "Medizinische Praxis"}
- Teamgröße: ${teamSize || "Nicht angegeben"}
${context ? `- Zusätzlicher Kontext: ${context}` : ""}

Erstelle 3-5 verschiedene Zuständigkeiten (Verantwortlichkeiten) für diese Praxis. Jede Zuständigkeit sollte einen wichtigen Bereich der Praxisorganisation abdecken (z.B. Patientenbetreuung, Abrechnung, Qualitätsmanagement, Terminverwaltung, Hygiene).

Antworte ausschließlich mit einem JSON-Array von Zuständigkeiten in folgendem Format (ohne Markdown, nur reines JSON):
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
      const errorMessage = aiError instanceof Error ? aiError.message : String(aiError)

      const fallbackResponsibilities = [
        {
          name: "Patientenaufnahme und -verwaltung",
          description:
            "Verantwortlich für die Aufnahme neuer Patienten, Pflege der Patientendaten, Terminvergabe und Koordination des Patientenflusses.",
          group_name: "Patientenversorgung",
          reasoning:
            "Eine strukturierte Patientenaufnahme ist der erste Eindruck und essentiell für einen reibungslosen Ablauf.",
        },
        {
          name: "Abrechnung und Finanzverwaltung",
          description:
            "Zuständig für die korrekte Abrechnung von Leistungen, Rechnungsstellung, Mahnwesen und Überwachung der Zahlungseingänge.",
          group_name: "Verwaltung",
          reasoning: "Eine saubere Abrechnung sichert die finanzielle Basis der Praxis.",
        },
        {
          name: "Qualitätsmanagement und Dokumentation",
          description:
            "Verantwortlich für die Einhaltung von Qualitätsstandards, Dokumentation von Prozessen und kontinuierliche Verbesserungen.",
          group_name: "Qualität",
          reasoning: "Qualitätsmanagement gewährleistet hohe Standards und erfüllt gesetzliche Anforderungen.",
        },
        {
          name: "Hygiene und Materialverwaltung",
          description:
            "Zuständig für die Einhaltung der Hygienevorschriften, Bestellung von Verbrauchsmaterialien und Gerätewartung.",
          group_name: "Organisation",
          reasoning: "Hygiene und Materialverfügbarkeit sind grundlegend für den Praxisbetrieb.",
        },
        {
          name: "Mitarbeiterkoordination und Teamentwicklung",
          description:
            "Verantwortlich für die Koordination des Teams, Urlaubsplanung, interne Kommunikation und Weiterbildung der Mitarbeiter.",
          group_name: "Team",
          reasoning: "Ein gut koordiniertes Team arbeitet effizienter und ist zufriedener.",
        },
      ]

      responsibilitiesData = fallbackResponsibilities
    }

    return NextResponse.json({ responsibilities: responsibilitiesData })
  } catch (error) {
    console.error(
      "[v0] Error in responsibility generation endpoint:",
      error instanceof Error ? error.message : String(error),
    )
    return NextResponse.json({ error: "Fehler beim Generieren der Zuständigkeiten" }, { status: 500 })
  }
}

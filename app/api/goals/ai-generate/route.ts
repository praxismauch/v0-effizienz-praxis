import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { applyRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit"

export async function POST(request: NextRequest) {
  // Apply rate limiting for AI operations
  const rateLimitResult = applyRateLimit(request, RATE_LIMITS.aiGenerate, "ai-goals")
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response
  }

  try {
    const { practiceType, context, goalType } = await request.json()

    let goalsData

    try {
      const prompt = `Du bist ein Experte für Praxismanagement und Zielsetzung in medizinischen Einrichtungen.

Kontext:
- Praxistyp: ${practiceType || "Medizinische Praxis"}
- Zielart: ${goalType === "practice" ? "Praxisziel" : goalType === "team" ? "Teamziel" : "Persönliches Ziel"}
${context ? `- Zusätzlicher Kontext: ${context}` : ""}

Erstelle 3-5 verschiedene SMART-Ziele (Spezifisch, Messbar, Attraktiv, Realistisch, Terminiert) für diese Praxis. Jedes Ziel sollte sich auf einen anderen wichtigen Bereich konzentrieren (z.B. Patientenzufriedenheit, Effizienz, Umsatz, Mitarbeiterentwicklung, Digitalisierung).

Antworte ausschließlich mit einem JSON-Array von Zielen in folgendem Format (ohne Markdown, nur reines JSON):
[
  {
    "title": "Kurzer, prägnanter Zieltitel (max 60 Zeichen)",
    "description": "Detaillierte Beschreibung des Ziels (2-3 Sätze)",
    "targetValue": Zahlenwert des Ziels (z.B. 100),
    "unit": "Einheit (z.B. 'Patienten', '%', '€', 'Termine')",
    "priority": "high" | "medium" | "low",
    "suggestedEndDate": "YYYY-MM-DD (3-6 Monate in der Zukunft)",
    "reasoning": "Kurze Erklärung, warum dieses Ziel sinnvoll ist"
  }
]`

      const { text } = await generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        prompt,
        temperature: 0.7,
        maxOutputTokens: 2000,
      })

      const cleanedText = text.trim().replace(/```json\n?|\n?```/g, "")
      goalsData = JSON.parse(cleanedText)
    } catch (aiError) {
      // Use intelligent fallback when AI fails
      const today = new Date()
      const endDate3Months = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
      const endDate6Months = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000)

      const fallbackGoals = {
        practice: [
          {
            title: "Patientenzufriedenheit steigern",
            description:
              "Die Zufriedenheit der Patienten durch optimierte Prozesse und bessere Kommunikation messbar verbessern.",
            targetValue: 85,
            unit: "%",
            priority: "high",
            suggestedEndDate: endDate3Months.toISOString().split("T")[0],
            reasoning: "Zufriedene Patienten führen zu mehr Weiterempfehlungen und besserer Praxisauslastung.",
          },
          {
            title: "Wartezeiten reduzieren",
            description:
              "Durchschnittliche Wartezeit der Patienten durch bessere Terminplanung auf unter 15 Minuten senken.",
            targetValue: 15,
            unit: "Minuten",
            priority: "high",
            suggestedEndDate: endDate3Months.toISOString().split("T")[0],
            reasoning: "Kürzere Wartezeiten erhöhen die Patientenzufriedenheit deutlich.",
          },
          {
            title: "Digitalisierungsgrad erhöhen",
            description: "Digitale Prozesse in der Praxis ausbauen und Papierdokumentation reduzieren.",
            targetValue: 80,
            unit: "%",
            priority: "medium",
            suggestedEndDate: endDate6Months.toISOString().split("T")[0],
            reasoning: "Digitalisierung steigert die Effizienz und reduziert Fehlerquellen.",
          },
          {
            title: "Umsatz steigern",
            description: "Praxisumsatz durch zusätzliche Leistungen und optimierte Abrechnung erhöhen.",
            targetValue: 15,
            unit: "%",
            priority: "medium",
            suggestedEndDate: endDate6Months.toISOString().split("T")[0],
            reasoning: "Wirtschaftliches Wachstum sichert die Zukunft der Praxis.",
          },
        ],
        team: [
          {
            title: "Team-Fortbildung durchführen",
            description:
              "Regelmäßige Schulungen und Weiterbildungen für alle Team-Mitglieder organisieren und durchführen.",
            targetValue: 4,
            unit: "Schulungen",
            priority: "medium",
            suggestedEndDate: endDate6Months.toISOString().split("T")[0],
            reasoning: "Gut geschulte Mitarbeiter arbeiten effizienter und sind motivierter.",
          },
          {
            title: "Team-Kommunikation verbessern",
            description: "Wöchentliche Team-Meetings und regelmäßige Feedback-Runden etablieren.",
            targetValue: 1,
            unit: "Meeting/Woche",
            priority: "high",
            suggestedEndDate: endDate3Months.toISOString().split("T")[0],
            reasoning: "Bessere Kommunikation führt zu weniger Missverständnissen und höherer Produktivität.",
          },
          {
            title: "Mitarbeiterzufriedenheit steigern",
            description: "Durch gezielte Maßnahmen die Zufriedenheit und Motivation des Teams erhöhen.",
            targetValue: 85,
            unit: "%",
            priority: "high",
            suggestedEndDate: endDate6Months.toISOString().split("T")[0],
            reasoning: "Zufriedene Mitarbeiter bleiben länger und erbringen bessere Leistungen.",
          },
        ],
        personal: [
          {
            title: "Persönliche Weiterentwicklung",
            description: "Fachliche Kompetenz durch Teilnahme an Fortbildungen und Fachliteratur erweitern.",
            targetValue: 3,
            unit: "Fortbildungen",
            priority: "medium",
            suggestedEndDate: endDate6Months.toISOString().split("T")[0],
            reasoning: "Kontinuierliche Weiterbildung sichert hohe fachliche Standards.",
          },
          {
            title: "Work-Life-Balance verbessern",
            description: "Arbeitszeiten optimieren und mehr Zeit für Familie und Erholung schaffen.",
            targetValue: 2,
            unit: "freie Tage/Monat",
            priority: "high",
            suggestedEndDate: endDate3Months.toISOString().split("T")[0],
            reasoning: "Gute Work-Life-Balance verhindert Burnout und erhält die Leistungsfähigkeit.",
          },
          {
            title: "Führungskompetenzen ausbauen",
            description: "Managementfähigkeiten durch Coaching und Leadership-Training stärken.",
            targetValue: 2,
            unit: "Trainings",
            priority: "medium",
            suggestedEndDate: endDate6Months.toISOString().split("T")[0],
            reasoning: "Bessere Führung führt zu einem effektiveren und motivierteren Team.",
          },
        ],
      }

      goalsData = fallbackGoals[goalType as keyof typeof fallbackGoals] || fallbackGoals.practice
    }

    return NextResponse.json({ goals: goalsData })
  } catch (error) {
    console.error("Error in goal generation endpoint:", error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: "Fehler beim Generieren der Ziele" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params
    const body = await request.json()
    const { action, context } = body

    if (!practiceId || !memberId) {
      return NextResponse.json({ error: "Missing practiceId or memberId" }, { status: 400 })
    }

    let prompt = ""
    const systemPrompt = `Du bist ein erfahrener HR-Experte und Coach für Mitarbeitergespräche in medizinischen Praxen.
Du gibst professionelle, konstruktive und motivierende Empfehlungen.
Antworte immer auf Deutsch und in einem professionellen aber freundlichen Ton.
Gib strukturierte, konkrete und umsetzbare Empfehlungen.`

    switch (action) {
      case "generate_summary":
        prompt = `Erstelle eine professionelle Zusammenfassung für ein Mitarbeitergespräch basierend auf folgenden Informationen:

Mitarbeiter: ${context.memberName}
Position: ${context.position || "Nicht angegeben"}
Gesprächsart: ${context.appraisalType}
Zeitraum: ${context.periodStart || "N/A"} bis ${context.periodEnd || "N/A"}

Leistungsbereiche und Bewertungen:
${context.performanceAreas?.map((p: any) => `- ${p.name}: ${p.rating}/5 (Gewichtung: ${p.weight}%)`).join("\n") || "Keine Bewertungen vorhanden"}

Gesamtbewertung: ${context.overallRating || "Nicht berechnet"}/5

Kompetenzen:
${context.competencies?.map((c: any) => `- ${c.name}: Aktuell ${c.currentLevel}/5, Ziel ${c.targetLevel}/5`).join("\n") || "Keine Kompetenzen bewertet"}

Erstelle eine 3-4 Absätze lange, professionelle Zusammenfassung die:
1. Die Gesamtleistung würdigt
2. Stärken hervorhebt
3. Entwicklungspotenziale anspricht
4. Einen positiven Ausblick gibt

Antworte NUR mit der Zusammenfassung, ohne zusätzliche Erklärungen.`
        break

      case "suggest_goals":
        prompt = `Basierend auf den Kompetenzlücken und der aktuellen Leistung, schlage 3-5 SMART-Ziele für den Mitarbeiter vor:

Mitarbeiter: ${context.memberName}
Position: ${context.position || "Nicht angegeben"}

Kompetenzlücken (Differenz zwischen Ziel und Ist):
${
  context.competencies
    ?.filter((c: any) => c.targetLevel > c.currentLevel)
    .map(
      (c: any) =>
        `- ${c.name}: Aktuell ${c.currentLevel}/5, Ziel ${c.targetLevel}/5 (Gap: ${c.targetLevel - c.currentLevel})`,
    )
    .join("\n") || "Keine Lücken identifiziert"
}

Leistungsbereiche mit Verbesserungspotenzial (unter 4/5):
${
  context.performanceAreas
    ?.filter((p: any) => p.rating < 4)
    .map((p: any) => `- ${p.name}: ${p.rating}/5`)
    .join("\n") || "Alle Bereiche gut"
}

Erstelle 3-5 konkrete SMART-Ziele im folgenden JSON-Format:
[
  {
    "title": "Zielname",
    "description": "Detaillierte Beschreibung",
    "measurable": "Wie wird der Erfolg gemessen",
    "deadline": "Zeitrahmen (z.B. '3 Monate')",
    "priority": "high/medium/low"
  }
]

Antworte NUR mit dem JSON-Array, ohne zusätzliche Erklärungen.`
        break

      case "generate_development_plan":
        prompt = `Erstelle einen detaillierten Entwicklungsplan für den Mitarbeiter:

Mitarbeiter: ${context.memberName}
Position: ${context.position || "Nicht angegeben"}

Identifizierte Entwicklungsbereiche:
${
  context.competencies
    ?.filter((c: any) => c.targetLevel > c.currentLevel)
    .map((c: any) => `- ${c.name}: Gap von ${c.targetLevel - c.currentLevel} Stufen`)
    .join("\n") || "Keine spezifischen Bereiche"
}

Zusätzlicher Kontext: ${context.additionalContext || "Keine weiteren Informationen"}

Erstelle 3-5 konkrete Entwicklungsmaßnahmen im folgenden JSON-Format:
[
  {
    "title": "Maßnahmenname",
    "description": "Detaillierte Beschreibung der Maßnahme",
    "type": "training/coaching/project/mentoring/self-study",
    "timeline": "Zeitrahmen",
    "resources": "Benötigte Ressourcen",
    "successCriteria": "Erfolgskriterien"
  }
]

Antworte NUR mit dem JSON-Array, ohne zusätzliche Erklärungen.`
        break

      case "analyze_strengths":
        prompt = `Analysiere die Stärken und Verbesserungsbereiche des Mitarbeiters:

Mitarbeiter: ${context.memberName}
Position: ${context.position || "Nicht angegeben"}

Leistungsbewertungen:
${context.performanceAreas?.map((p: any) => `- ${p.name}: ${p.rating}/5`).join("\n") || "Keine Bewertungen"}

Kompetenzbewertungen:
${context.competencies?.map((c: any) => `- ${c.name}: ${c.currentLevel}/5`).join("\n") || "Keine Kompetenzen"}

Bisherige Erfolge: ${context.achievements || "Keine dokumentiert"}

Erstelle eine Analyse im folgenden JSON-Format:
{
  "strengths": ["Stärke 1", "Stärke 2", "Stärke 3"],
  "strengthsDetail": "Detaillierte Beschreibung der Hauptstärken (2-3 Sätze)",
  "improvements": ["Verbesserungsbereich 1", "Verbesserungsbereich 2"],
  "improvementsDetail": "Konstruktive Beschreibung der Entwicklungsbereiche (2-3 Sätze)",
  "potentials": ["Potenzial 1", "Potenzial 2"],
  "recommendation": "Zusammenfassende Empfehlung für die weitere Entwicklung"
}

Antworte NUR mit dem JSON-Objekt, ohne zusätzliche Erklärungen.`
        break

      case "generate_feedback":
        prompt = `Formuliere konstruktives Feedback für das Mitarbeitergespräch:

Mitarbeiter: ${context.memberName}
Position: ${context.position || "Nicht angegeben"}
Feedbacktyp: ${context.feedbackType} (strengths/improvements/overall)

Kontext:
- Leistungsbewertung: ${context.overallRating || "N/A"}/5
- Stärken: ${context.existingStrengths || "Nicht dokumentiert"}
- Verbesserungsbereiche: ${context.existingImprovements || "Nicht dokumentiert"}

${
  context.feedbackType === "strengths"
    ? "Formuliere ein motivierendes Feedback zu den Stärken (3-4 Sätze)."
    : context.feedbackType === "improvements"
      ? "Formuliere konstruktives Feedback zu Entwicklungsbereichen (3-4 Sätze). Sei konkret aber ermutigend."
      : "Formuliere ein ausgewogenes Gesamtfeedback (4-5 Sätze) das Stärken würdigt und Entwicklung anspricht."
}

Antworte NUR mit dem Feedbacktext, ohne zusätzliche Erklärungen.`
        break

      case "generate_career_advice":
        prompt = `Erstelle Karriereempfehlungen für den Mitarbeiter:

Mitarbeiter: ${context.memberName}
Position: ${context.position || "Nicht angegeben"}
Karrierewunsch: ${context.careerAspiration || "Nicht angegeben"}
Beförderungspotenzial: ${context.promotionReadiness || "Nicht bewertet"}

Aktuelle Kompetenzen:
${context.competencies?.map((c: any) => `- ${c.name}: ${c.currentLevel}/5`).join("\n") || "Keine Bewertungen"}

Erstelle Karriereempfehlungen im folgenden JSON-Format:
{
  "shortTermSteps": ["Schritt 1 (0-6 Monate)", "Schritt 2"],
  "mediumTermSteps": ["Schritt 1 (6-18 Monate)", "Schritt 2"],
  "longTermVision": "Langfristige Karriereperspektive (1-2 Sätze)",
  "requiredSkills": ["Kompetenz 1", "Kompetenz 2"],
  "recommendations": "Konkrete Handlungsempfehlung (2-3 Sätze)"
}

Antworte NUR mit dem JSON-Objekt, ohne zusätzliche Erklärungen.`
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: systemPrompt,
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

    // Try to parse JSON responses
    let result: any = text

    if (
      ["suggest_goals", "generate_development_plan", "analyze_strengths", "generate_career_advice"].includes(action)
    ) {
      try {
        // Extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0])
        }
      } catch (e) {
        console.error("[v0] Failed to parse AI response as JSON:", e)
        // Return raw text if parsing fails
        result = text
      }
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("[v0] AI generate error:", error)
    return NextResponse.json({ error: "Fehler bei der KI-Generierung" }, { status: 500 })
  }
}

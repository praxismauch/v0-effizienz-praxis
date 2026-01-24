import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

const FALLBACK_QUESTIONNAIRES: Record<
  string,
  {
    title: string
    description: string
    questions: Array<{
      question: string
      type: string
      options?: string[]
      required: boolean
    }>
  }
> = {
  mfa: {
    title: "Bewerberfragebogen für Medizinische Fachangestellte",
    description: "Fragebogen zur Erfassung relevanter Qualifikationen und Erfahrungen für die Position als MFA",
    questions: [
      { question: "Vollständiger Name", type: "text", required: true },
      { question: "E-Mail-Adresse", type: "text", required: true },
      { question: "Telefonnummer", type: "text", required: true },
      { question: "Wie viele Jahre Berufserfahrung haben Sie als MFA?", type: "number", required: true },
      {
        question: "In welchen Fachbereichen haben Sie bisher gearbeitet?",
        type: "checkbox",
        options: [
          "Allgemeinmedizin",
          "Innere Medizin",
          "Kardiologie",
          "Orthopädie",
          "Pädiatrie",
          "Gynäkologie",
          "Sonstiges",
        ],
        required: true,
      },
      {
        question: "Welche Praxissoftware kennen Sie?",
        type: "checkbox",
        options: ["CGM TURBOMED", "CGM M1 PRO", "medatixx", "x.comfort", "tomedo", "Andere"],
        required: true,
      },
      {
        question: "Verfügen Sie über Erfahrung in der Blutentnahme und Labordiagnostik?",
        type: "radio",
        options: ["Ja, umfangreiche Erfahrung", "Ja, grundlegende Kenntnisse", "Nein, aber lernbereit"],
        required: true,
      },
      {
        question: "Können Sie EKG schreiben und auswerten?",
        type: "radio",
        options: ["Ja", "Teilweise", "Nein"],
        required: true,
      },
      { question: "Warum möchten Sie in unserer Praxis arbeiten?", type: "textarea", required: true },
      { question: "Ab wann wären Sie verfügbar?", type: "text", required: true },
      { question: "Wie ist Ihre Gehaltsvorstellung (brutto/Monat)?", type: "number", required: false },
      {
        question: "Sind Sie bereit, auch an Samstagen oder in Randzeiten zu arbeiten?",
        type: "radio",
        options: ["Ja", "Gelegentlich", "Nein"],
        required: true,
      },
    ],
  },
  arzt: {
    title: "Bewerberfragebogen für Ärzte",
    description: "Fragebogen zur Erfassung von Qualifikationen und Karrierezielen für ärztliche Positionen",
    questions: [
      { question: "Vollständiger Name mit Titel", type: "text", required: true },
      { question: "E-Mail-Adresse", type: "text", required: true },
      { question: "Approbationsjahr", type: "number", required: true },
      { question: "Facharztbezeichnung(en)", type: "text", required: true },
      { question: "Zusatzbezeichnungen und Qualifikationen", type: "textarea", required: false },
      { question: "Wie viele Jahre Berufserfahrung haben Sie nach der Approbation?", type: "number", required: true },
      {
        question: "In welchem Setting möchten Sie primär arbeiten?",
        type: "radio",
        options: ["Einzelpraxis", "Gemeinschaftspraxis", "MVZ", "Flexibel"],
        required: true,
      },
      {
        question: "Streben Sie eine Partnerschaft/Teilhaberschaft an?",
        type: "radio",
        options: ["Ja, kurzfristig", "Ja, mittelfristig", "Nein, reine Anstellung", "Unentschieden"],
        required: true,
      },
      { question: "Beschreiben Sie Ihre wichtigsten klinischen Schwerpunkte", type: "textarea", required: true },
      {
        question: "Welche besonderen Leistungen können Sie anbieten? (z.B. Sonographie, Akupunktur)",
        type: "textarea",
        required: false,
      },
      { question: "Ab wann wären Sie verfügbar?", type: "text", required: true },
      { question: "Haben Sie Fragen an uns?", type: "textarea", required: false },
    ],
  },
  verwaltung: {
    title: "Bewerberfragebogen für Praxismanagement/Verwaltung",
    description: "Fragebogen für administrative und Management-Positionen in der Praxis",
    questions: [
      { question: "Vollständiger Name", type: "text", required: true },
      { question: "E-Mail-Adresse", type: "text", required: true },
      { question: "Höchster Bildungsabschluss", type: "text", required: true },
      { question: "Jahre Erfahrung im Praxis-/Gesundheitsmanagement", type: "number", required: true },
      {
        question: "Welche Bereiche haben Sie bisher verantwortet?",
        type: "checkbox",
        options: [
          "Personalführung",
          "Abrechnung (KV/privat)",
          "Qualitätsmanagement",
          "Controlling/Finanzen",
          "Marketing",
          "IT-Administration",
        ],
        required: true,
      },
      { question: "Erfahrung mit Praxissoftware und digitalen Tools", type: "textarea", required: true },
      { question: "Wie groß war das Team, das Sie zuletzt geführt haben?", type: "number", required: false },
      {
        question: "Beschreiben Sie eine Verbesserung, die Sie in Ihrer letzten Position umgesetzt haben",
        type: "textarea",
        required: true,
      },
      { question: "Was motiviert Sie an der Position in unserer Praxis?", type: "textarea", required: true },
      { question: "Ab wann wären Sie verfügbar?", type: "text", required: true },
      { question: "Gehaltsvorstellung (brutto/Jahr)", type: "number", required: false },
    ],
  },
  default: {
    title: "Allgemeiner Bewerberfragebogen",
    description: "Standardfragebogen für Bewerbungen in der medizinischen Praxis",
    questions: [
      { question: "Vollständiger Name", type: "text", required: true },
      { question: "E-Mail-Adresse", type: "text", required: true },
      { question: "Telefonnummer", type: "text", required: true },
      { question: "Für welche Position bewerben Sie sich?", type: "text", required: true },
      { question: "Wie viele Jahre Berufserfahrung haben Sie in diesem Bereich?", type: "number", required: true },
      { question: "Beschreiben Sie Ihre relevanten Qualifikationen und Erfahrungen", type: "textarea", required: true },
      { question: "Warum möchten Sie in unserer Praxis arbeiten?", type: "textarea", required: true },
      { question: "Was sind Ihre besonderen Stärken?", type: "textarea", required: true },
      { question: "Ab wann wären Sie verfügbar?", type: "text", required: true },
      {
        question: "Bevorzugte Arbeitszeit",
        type: "radio",
        options: ["Vollzeit", "Teilzeit", "Flexibel"],
        required: true,
      },
      { question: "Gehaltsvorstellung", type: "text", required: false },
      { question: "Haben Sie Fragen an uns?", type: "textarea", required: false },
    ],
  },
}

function getFallbackQuestionnaire(jobTitle: string) {
  const lowerTitle = jobTitle.toLowerCase()

  if (
    lowerTitle.includes("mfa") ||
    lowerTitle.includes("medizinische fachangestellte") ||
    lowerTitle.includes("arzthelferin")
  ) {
    return FALLBACK_QUESTIONNAIRES.mfa
  }
  if (
    lowerTitle.includes("arzt") ||
    lowerTitle.includes("ärztin") ||
    lowerTitle.includes("doktor") ||
    lowerTitle.includes("facharzt")
  ) {
    return FALLBACK_QUESTIONNAIRES.arzt
  }
  if (
    lowerTitle.includes("verwaltung") ||
    lowerTitle.includes("management") ||
    lowerTitle.includes("praxismanager") ||
    lowerTitle.includes("office")
  ) {
    return FALLBACK_QUESTIONNAIRES.verwaltung
  }

  // Customize the default template with the job title
  const defaultTemplate = { ...FALLBACK_QUESTIONNAIRES.default }
  defaultTemplate.title = `Bewerberfragebogen für ${jobTitle}`
  return defaultTemplate
}

export async function POST(request: NextRequest) {
  try {
    const { practiceId, jobTitle, requirements } = await request.json()

    if (!practiceId || !jobTitle) {
      return NextResponse.json({ error: "Practice ID and job title are required" }, { status: 400 })
    }

    // Generate questionnaire using AI
    const prompt = `Du bist ein HR-Experte für medizinische Praxen. Erstelle einen professionellen Fragebogen für die folgende Stelle:

Stellenbezeichnung: ${jobTitle}
${requirements ? `Spezielle Anforderungen: ${requirements}` : ""}

Erstelle einen Fragebogen mit 8-12 relevanten Fragen, die helfen, die Eignung der Kandidaten zu bewerten.

WICHTIG: Antworte ausschließlich mit einem validen JSON-Objekt in folgendem Format, ohne zusätzlichen Text:

{
  "title": "Fragebogen für [Stellenbezeichnung]",
  "description": "Eine kurze Beschreibung des Fragebogens",
  "questions": [
    {
      "question": "Die Frage",
      "type": "text|textarea|radio|checkbox|number",
      "options": ["Option 1", "Option 2"] (nur für radio/checkbox),
      "required": true|false
    }
  ]
}

Verwende verschiedene Fragetypen:
- "text" für kurze Antworten (Name, Email, etc.)
- "textarea" für längere Antworten (Motivation, Erfahrungen)
- "number" für numerische Werte (Jahre Erfahrung, Gehaltsvorstellung)
- "radio" für Einfachauswahl mit mehreren Optionen
- "checkbox" für Mehrfachauswahl

Stelle sicher, dass die Fragen:
1. Relevant für die medizinische Praxis sind
2. Die fachliche Eignung bewerten
3. Soft Skills abfragen
4. Verfügbarkeit klären
5. Motivation erfassen

Gib NUR das JSON-Objekt zurück, keine zusätzlichen Erklärungen!`

    let questionnaire
    try {
      const { text } = await generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        prompt,
        temperature: 0.7,
        maxOutputTokens: 2000,
      })

      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        questionnaire = JSON.parse(jsonMatch[0])
      } else {
        questionnaire = JSON.parse(text)
      }

      // Validate questionnaire structure
      if (!questionnaire.title || !questionnaire.questions || !Array.isArray(questionnaire.questions)) {
        throw new Error("Invalid questionnaire structure")
      }
    } catch (aiError) {
      console.error("[v0] AI generation failed, using fallback:", aiError)
      // Use fallback questionnaire
      questionnaire = getFallbackQuestionnaire(jobTitle)
    }

    return NextResponse.json({
      questionnaire,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error generating questionnaire:", error)
    const fallback = FALLBACK_QUESTIONNAIRES.default
    return NextResponse.json({
      questionnaire: fallback,
      generatedAt: new Date().toISOString(),
      fallback: true,
    })
  }
}

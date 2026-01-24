import type { NextRequest } from "next/server"
import { streamText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { prompt, context, fieldType } = await request.json()

    const systemPrompt = getSystemPrompt(fieldType)
    const userPrompt = constructUserPrompt(prompt, context, fieldType)

    const result = await streamText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxOutputTokens: 1000,
    })

    return result.toTextStreamResponse()
  } catch (error: any) {
    console.error("[v0] AI generation error:", error)
    console.error("[v0] Error message:", error.message)
    console.error("[v0] Error stack:", error.stack)

    const requestJson = await request.json()
    const fallbackText = getFallbackText(requestJson.fieldType, requestJson.prompt, requestJson.context)

    return new Response(fallbackText, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
}

function getSystemPrompt(fieldType: string): string {
  const prompts: Record<string, string> = {
    stellenbeschreibung: `Sie sind ein erfahrener HR-Spezialist für medizinische Praxen in Deutschland. 
Ihre Aufgabe ist es, professionelle, ansprechende und rechtskonforme Stellenbeschreibungen für medizinische Fachkräfte zu erstellen.

Richtlinien:
- Verwenden Sie eine professionelle, aber einladende Sprache
- Strukturieren Sie den Text klar mit Absätzen und Aufzählungen
- Heben Sie die Besonderheiten der Position hervor
- Verwenden Sie branchenübliche Formulierungen
- Achten Sie auf Gleichberechtigung (m/w/d)
- Machen Sie die Position attraktiv, aber bleiben Sie realistisch
- Verwenden Sie keine Markdown-Formatierung, nur Absätze und • für Listen
- Der Text sollte 200-400 Wörter umfassen`,

    anforderungen: `Sie sind ein HR-Experte für medizinische Fachkräfte in Deutschland.
Erstellen Sie klare, realistische Anforderungsprofile für Stellenausschreibungen im Gesundheitswesen.

Richtlinien:
- Unterscheiden Sie zwischen Muss- und Kann-Anforderungen
- Verwenden Sie branchenübliche Qualifikationen
- Seien Sie spezifisch aber nicht zu restriktiv
- Strukturieren Sie nach: Fachliche Qualifikationen, Persönliche Kompetenzen, Wünschenswert
- Verwenden Sie keine Markdown-Formatierung, nur Absätze und • für Listen
- Halten Sie es prägnant (100-200 Wörter)`,

    aufgaben: `Sie sind ein HR-Spezialist für medizinische Praxen.
Beschreiben Sie Aufgabenbereiche klar, präzise und motivierend.

Richtlinien:
- Gliedern Sie nach Hauptaufgaben und Zusatzaufgaben
- Verwenden Sie aktive, handlungsorientierte Sprache
- Seien Sie konkret und detailliert
- Vermitteln Sie die Vielfalt und Bedeutung der Tätigkeit
- Verwenden Sie keine Markdown-Formatierung, nur Absätze und • für Listen
- Halten Sie es prägnant (100-200 Wörter)`,

    benefits: `Sie sind ein HR-Experte für Employer Branding im Gesundheitswesen.
Erstellen Sie attraktive, authentische Beschreibungen von Mitarbeitervorteilen.

Richtlinien:
- Seien Sie spezifisch und konkret (nicht nur "attraktive Vergütung")
- Gruppieren Sie Benefits logisch (Vergütung, Work-Life-Balance, Entwicklung, Kultur)
- Heben Sie besondere oder einzigartige Benefits hervor
- Verwenden Sie eine positive, motivierende Sprache
- Verwenden Sie keine Markdown-Formatierung, nur Absätze und • für Listen
- Halten Sie es prägnant (100-150 Wörter)`,

    default: `Sie sind ein professioneller Texter für Stellenausschreibungen im deutschen Gesundheitswesen.
Erstellen Sie klare, professionelle und ansprechende Texte.

Verwenden Sie keine Markdown-Formatierung, nur Absätze und • für Listen.`,
  }

  return prompts[fieldType.toLowerCase()] || prompts.default
}

function constructUserPrompt(prompt: string, context: string, fieldType: string): string {
  const contextInfo = context ? `\n\nKontext: ${context}` : ""

  return `Erstellen Sie einen professionellen Text für den Bereich "${fieldType}" basierend auf folgender Anfrage:

${prompt}${contextInfo}

Wichtig: 
- Schreiben Sie auf Deutsch
- Verwenden Sie KEINE Markdown-Formatierung (keine **, ##, etc.)
- Verwenden Sie nur einfache Absätze und • Aufzählungszeichen
- Der Text soll direkt verwendbar sein`
}

function getFallbackText(fieldType: string, prompt: string, context?: string): string {
  const templates: Record<string, string> = {
    stellenbeschreibung: `Stellenbeschreibung

Wir suchen zur Verstärkung unseres Teams eine qualifizierte Fachkraft (m/w/d) mit Engagement und Fachkompetenz.

Ihre Aufgaben:
• Professionelle Patientenbetreuung und umfassende medizinische Versorgung
• Eigenverantwortliche Durchführung von Behandlungen und Untersuchungen  
• Unterstützung und enge Zusammenarbeit mit dem Praxisteam
• Administrative und organisatorische Tätigkeiten
• Dokumentation und Qualitätssicherung

Ihr Profil:
• Abgeschlossene Ausbildung im medizinischen Bereich
• Idealerweise Berufserfahrung in einer vergleichbaren Position
• Ausgeprägte Sozialkompetenz und Freude am Patientenkontakt
• Teamfähigkeit, Zuverlässigkeit und Verantwortungsbewusstsein
• Sicherer Umgang mit Praxissoftware

Wir bieten:
• Eine verantwortungsvolle und abwechslungsreiche Tätigkeit
• Ein motiviertes, kollegiales Team mit wertschätzender Atmosphäre
• Moderne Praxisausstattung und digitale Arbeitsmittel
• Strukturierte Einarbeitung und regelmäßige Fortbildungen
• Leistungsgerechte Vergütung und attraktive Zusatzleistungen

${prompt ? `\nHinweis: ${prompt}` : ""}`,

    anforderungen: `Anforderungen

Fachliche Qualifikationen:
• Abgeschlossene Berufsausbildung im medizinischen Bereich
• Fundierte Fachkenntnisse und praktische Erfahrung
• Sicherer Umgang mit medizinischen Geräten und Instrumenten
• Kenntnisse in Praxismanagement Software

Persönliche Kompetenzen:
• Ausgeprägte Kommunikations- und Teamfähigkeit
• Einfühlungsvermögen im Umgang mit Patienten
• Organisationstalent und strukturierte Arbeitsweise
• Zuverlässigkeit, Flexibilität und Belastbarkeit
• Bereitschaft zur kontinuierlichen Weiterbildung

Wünschenswert:
• Zusatzqualifikationen oder Spezialisierungen
• Mehrjährige Berufserfahrung in vergleichbarer Position
• Kenntnisse in Qualitätsmanagement

${prompt ? `\n${prompt}` : ""}`,

    aufgaben: `Aufgaben

Ihre Hauptaufgaben:
• Empfang und Betreuung von Patienten
• Vorbereitung und Assistenz bei Untersuchungen und Behandlungen
• Durchführung medizinischer Maßnahmen im Rahmen Ihrer Qualifikation
• Probenentnahme und Laborarbeiten
• Terminkoordination und Patientenverwaltung

Weitere Tätigkeiten:
• Pflege und Verwaltung von Patientenakten
• Bestellwesen und Lagerverwaltung
• Abrechnung mit Krankenkassen
• Qualitätssicherung und Hygienemanagement
• Mitarbeit an Praxisorganisation und -entwicklung

${prompt ? `\n${prompt}` : ""}`,

    benefits: `Was wir bieten

Vergütung & Zusatzleistungen:
• Leistungsgerechte Vergütung nach Qualifikation und Erfahrung
• Betriebliche Altersvorsorge
• Jahressonderzahlungen (Urlaubs- und Weihnachtsgeld)

Work-Life-Balance:
• Geregelte Arbeitszeiten ohne Wochenend- und Nachtdienste
• 30 Tage Jahresurlaub
• Flexible Arbeitszeitmodelle nach Absprache

Entwicklung & Weiterbildung:
• Strukturierte Einarbeitung
• Regelmäßige Fort- und Weiterbildungsmöglichkeiten
• Unterstützung bei Zusatzqualifikationen

Arbeitsumfeld:
• Moderne, volldigitalisierte Praxis
• Kollegiales, wertschätzendes Team
• Kurze Entscheidungswege

${prompt ? `\n${prompt}` : ""}`,

    default: `${fieldType}

${prompt}

${context || "Bitte passen Sie diesen Text an Ihre Bedürfnisse an."}`,
  }

  return templates[fieldType.toLowerCase()] || templates.default
}

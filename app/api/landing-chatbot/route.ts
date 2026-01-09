import { streamText } from "ai"

export const maxDuration = 30

const systemPrompt = `Du bist ein freundlicher und kompetenter KI-Assistent für Effizienz Praxis, eine KI-gestützte Praxismanagement Software für medizinische Einrichtungen.

**SPRACHE: Du antwortest IMMER auf Deutsch. Alle deine Antworten müssen in deutscher Sprache verfasst sein.**

**WICHTIGE EINSCHRÄNKUNG - DATENSCHUTZ:**
Du hast KEINEN Zugriff auf interne Praxisdaten, Patientendaten, Benutzerdaten oder andere vertrauliche Informationen aus der App.
Du darfst NUR über öffentlich verfügbare Informationen zur Effizienz Praxis Software sprechen.
Wenn jemand nach internen Daten fragt, erkläre höflich, dass du nur über die Software-Features und öffentliche Informationen Auskunft geben kannst.

**Über Effizienz Praxis:**

Effizienz Praxis ist eine umfassende Praxismanagement Software mit folgenden Hauptfunktionen:

1. **KI-Praxisanalyse**: Automatische Analyse der Praxisdaten mit Stärken-Schwächen-Profil, Trends und konkreten Optimierungsvorschlägen
2. **Analytics & KPIs**: Customizable Dashboards mit Echtzeit-Kennzahlen, interaktiven Charts und Reports
3. **Ziele & OKRs**: Team-Ziele setzen und tracken mit Fortschrittsüberwachung
4. **Workflow Automation**: KI-gestützte Workflow-Erstellung und automatisierte Prozesse
5. **Team & Organigramm**: Visualisiertes Team-Management mit interaktivem Organigramm
6. **Recruiting System**: Komplette Hiring-Pipeline mit Bewerbermanagement und KI-Textgenerierung
7. **Aufgabenmanagement**: Smart Todo-Listen mit KI-generierten Aufgabenvorschlägen
8. **Kalender & Termine**: Integrierter Kalender mit KI-Terminvorschlägen
9. **Dokumentenverwaltung**: Zentrale Ablage mit Versionierung und KI-Analyse
10. **QM Dokumentation**: Wissensdatenbank für Qualitätsmanagement und SOPs
11. **Rollen & Berechtigungen**: Granulare Zugriffsrechte und sichere Datenverwaltung
12. **DSGVO-Konformität**: Höchste Sicherheitsstandards und konforme Datenhaltung

**Warum Effizienz wichtig ist:**
- Effiziente Praxis = wirtschaftlich starke Praxis
- Effizienz bedeutet: weniger Stress, weniger Fehler, höhere Qualität, zufriedenere Mitarbeitende, höhere Gewinne

**KI-Features:**
- KI-Praxisanalyse mit Optimierungsvorschlägen
- Workflow-Generator (Prozesse in eigenen Worten beschreiben)
- Smart Aufgaben-Vorschläge basierend auf Zielen und Workflows
- Recruiting-Assistent für Stellenausschreibungen
- Termin-Optimierung im Kalender
- Analytics Insights mit Trend-Erkennung
- Dokument-Analyse und Organisation
- SMART-Ziele Generierung

**Vorteile:**
- 24% Effizienzsteigerung
- Zentrale Verwaltung aller Praxisprozesse
- Datenbasierte Entscheidungen durch Analytics
- DSGVO-konforme Datenhaltung
- Intuitiv bedienbar
- Für Arztpraxen, MVZ und medizinische Zentren

**Preise:**
- Starter: 49€/Monat - Für kleine Praxen bis 5 Mitarbeiter
- Professional: 99€/Monat - Für mittlere Praxen bis 15 Mitarbeiter
- Enterprise: 199€/Monat - Für große Praxen und MVZ

**Kontakt:**
- Website: effizienz-praxis.de
- Inhaber: Dr. Daniel Mauch
- Adresse: Allgäuerstr. 106, 87600 Kaufbeuren, Deutschland

**Zielgruppe:**
Ärzte, Praxisinhaber, MVZ, medizinische Zentren, Praxismanager

**Deine Aufgabe:**
- Beantworte Fragen zu Effizienz Praxis präzise und freundlich auf Deutsch
- Erkläre Features verständlich und praxisnah
- Hebe die Vorteile und den Nutzen für die Praxis hervor
- Sei hilfreich und ermutigend
- Wenn du etwas nicht weißt, empfehle dem Nutzer, sich über das Kontaktformular zu melden
- NIEMALS interne Praxis- oder Patientendaten preisgeben oder darüber spekulieren

**Wichtig:**
- **ANTWORTE IMMER AUF DEUTSCH** - auch wenn die Frage auf Englisch gestellt wird
- Sei präzise aber nicht zu technisch
- Fokussiere auf den praktischen Nutzen
- Halte Antworten kurz und auf den Punkt (2-4 Sätze pro Antwort)
- Verweise bei Interesse auf die Demo oder das Kontaktformular
`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Keine Nachricht erhalten",
          errorCode: "NO_MESSAGES",
          userMessage: "Bitte geben Sie eine Frage ein.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const coreMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))

    const result = await streamText({
      model: "openai/gpt-4o",
      system: systemPrompt,
      messages: coreMessages,
      maxTokens: 500,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("[v0] Landing chatbot error:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    let userMessage = "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut."
    let errorCode = "UNKNOWN_ERROR"

    if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      userMessage = "Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut."
      errorCode = "RATE_LIMIT"
    } else if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
      userMessage = "Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut."
      errorCode = "TIMEOUT"
    } else if (errorMessage.includes("API") || errorMessage.includes("key") || errorMessage.includes("401")) {
      userMessage = "Der KI-Service ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut."
      errorCode = "API_ERROR"
    } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      userMessage = "Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung."
      errorCode = "NETWORK_ERROR"
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        errorCode,
        userMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

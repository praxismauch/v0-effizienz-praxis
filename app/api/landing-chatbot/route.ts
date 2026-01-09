import { createClient } from "@supabase/supabase-js"

export const maxDuration = 30

// Initialize Supabase client for logging
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

async function logChatInteraction(data: {
  question: string
  response: string
  matchedFaqKey: string | null
  isDefaultResponse: boolean
  isGreeting: boolean
  responseTimeMs: number
  sessionId?: string
  userAgent?: string
  referrer?: string
  pageUrl?: string
}) {
  // Only log if Supabase is configured
  if (!supabaseUrl || !supabaseKey) {
    console.log("[v0] Landing chatbot: Supabase not configured, skipping log")
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    await supabase.from("landing_chat_logs").insert({
      question: data.question,
      response: data.response,
      matched_faq_key: data.matchedFaqKey,
      is_default_response: data.isDefaultResponse,
      is_greeting: data.isGreeting,
      response_time_ms: data.responseTimeMs,
      session_id: data.sessionId,
      user_agent: data.userAgent,
      referrer: data.referrer,
      page_url: data.pageUrl,
    })
  } catch (error) {
    // Don't fail the request if logging fails
    console.error("[v0] Landing chatbot: Failed to log interaction:", error)
  }
}

// Predefined FAQ responses based on the original system prompt
const FAQ_RESPONSES: Record<string, { keywords: string[]; response: string }> = {
  kennzahlen: {
    keywords: [
      "kennzahl",
      "kpi",
      "steuern",
      "steuer",
      "parameter",
      "messwert",
      "auswert",
      "dashboard",
      "übersicht",
      "analytics",
      "metrik",
      "tracking",
      "monitor",
    ],
    response: `**Ja, Sie können Kennzahlen (KPIs) vollständig steuern!**

📊 **Analytics Dashboard**
- Echtzeit-Übersicht aller wichtigen Kennzahlen
- Individuelle Dashboards pro Rolle
- Historische Vergleiche und Trends

⚙️ **Flexible Parameterverwaltung**
- Eigene KPIs definieren und tracken
- Zielwerte und Schwellenwerte festlegen
- Automatische Benachrichtigungen bei Abweichungen

📈 **Steuerungsmöglichkeiten**
- Drill-Down in Detailauswertungen
- Export für externe Analyse
- Vergleich mit Benchmark-Daten

🎯 **Beispiel-KPIs:**
- Patientenzufriedenheit
- Auslastung
- Wirtschaftliche Kennzahlen
- Team-Performance
- Prozesseffizienz

Sie behalten die volle Kontrolle über Ihre Praxiskennzahlen!`,
  },
  funktionen: {
    keywords: ["funktion", "feature", "was kann", "was bietet", "möglichkeiten", "leistung"],
    response: `**Effizienz Praxis bietet folgende Hauptfunktionen:**

1. **KI-Praxisanalyse** - Automatische Analyse mit Optimierungsvorschlägen
2. **Analytics & KPIs** - Dashboards mit Echtzeit-Kennzahlen
3. **Ziele & OKRs** - Team-Ziele setzen und tracken
4. **Workflow Automation** - KI-gestützte automatisierte Prozesse
5. **Team & Organigramm** - Visualisiertes Team-Management
6. **Recruiting System** - Bewerbermanagement mit KI-Textgenerierung
7. **Aufgabenmanagement** - Smart Todo-Listen
8. **Kalender & Termine** - Mit KI-Terminvorschlägen
9. **Dokumentenverwaltung** - Zentrale Ablage mit KI-Analyse
10. **QM Dokumentation** - Wissensdatenbank für SOPs

Haben Sie Interesse an einer Demo? Besuchen Sie uns auf effizienz-praxis.de!`,
  },
  preise: {
    keywords: ["preis", "kosten", "kostet", "tarif", "paket", "abo", "euro", "€", "monat", "jahr", "lizenz"],
    response: `**Unsere Preise:**

- **Starter:** 49€/Monat (bis 5 Mitarbeiter)
- **Professional:** 99€/Monat (bis 15 Mitarbeiter)  
- **Enterprise:** 199€/Monat (große Praxen/MVZ)

Alle Pakete beinhalten:
- Voller Funktionsumfang
- Deutsche Server (DSGVO-konform)
- Regelmäßige Updates
- E-Mail Support

Kontaktieren Sie uns für ein individuelles Angebot oder eine kostenlose Demo!`,
  },
  dsgvo: {
    keywords: ["dsgvo", "datenschutz", "sicherheit", "sicher", "daten", "konform", "gdpr", "privacy"],
    response: `**Ja, Effizienz Praxis ist vollständig DSGVO-konform!**

Unsere Sicherheitsmaßnahmen:
- 🔒 **Deutsche Server** - Alle Daten werden in Deutschland gehostet
- 🛡️ **Verschlüsselung** - Ende-zu-Ende-Verschlüsselung aller Daten
- ✅ **DSGVO-Compliance** - Volle Einhaltung der EU-Datenschutzrichtlinien
- 📋 **AV-Vertrag** - Auftragsverarbeitungsvertrag auf Anfrage
- 🔐 **Zugriffskontrolle** - Rollenbasierte Berechtigungen

Ihre Praxis- und Patientendaten sind bei uns sicher!`,
  },
  ki: {
    keywords: ["ki", "künstliche intelligenz", "ai", "automatisch", "intelligent", "analyse", "praxisanalyse"],
    response: `**So hilft KI Ihrer Praxis:**

🤖 **KI-Praxisanalyse**
- Automatische Erkennung von Optimierungspotenzialen
- Vergleich mit anonymisierten Benchmark-Daten
- Konkrete Handlungsempfehlungen

📊 **Intelligente Auswertungen**
- Automatische Erstellung von Reports
- Trend-Erkennung bei KPIs
- Prognosen für Ihre Praxisentwicklung

⚡ **Workflow-Automation**
- Automatisierte Routineaufgaben
- KI-gestützte Terminvorschläge
- Intelligente Dokumentenanalyse

Die KI unterstützt Sie - die Kontrolle behalten Sie!`,
  },
  kontakt: {
    keywords: ["kontakt", "erreichen", "telefon", "email", "adresse", "ansprechpartner", "demo", "termin"],
    response: `**So erreichen Sie uns:**

👤 **Ansprechpartner:** Dr. Daniel Mauch
🌐 **Website:** effizienz-praxis.de
📍 **Adresse:** Allgäuerstr. 106, 87600 Kaufbeuren

**Vereinbaren Sie eine kostenlose Demo!**
Wir zeigen Ihnen gerne, wie Effizienz Praxis Ihre Praxis optimieren kann.

Besuchen Sie unsere Website für weitere Informationen und das Kontaktformular.`,
  },
  team: {
    keywords: ["team", "mitarbeiter", "organigramm", "personal", "organisation"],
    response: `**Team-Management mit Effizienz Praxis:**

👥 **Organigramm**
- Visualisierte Teamstruktur
- Übersichtliche Hierarchien
- Einfache Verwaltung

📋 **Mitarbeiterverwaltung**
- Vollständige Personalakte
- Fortbildungsübersicht
- Urlaubsverwaltung

🎯 **Ziele & OKRs**
- Team-Ziele definieren
- Fortschritt tracken
- Feedback-System

Perfekt für Praxen jeder Größe!`,
  },
  recruiting: {
    keywords: ["recruiting", "bewerb", "stellen", "job", "personal suchen", "mitarbeiter finden"],
    response: `**Recruiting-System von Effizienz Praxis:**

📝 **Stellenausschreibungen**
- KI-generierte Stellentexte
- Multi-Portal-Veröffentlichung
- Bewerbungsformular

👔 **Bewerbermanagement**
- Übersichtliche Kandidatenprofile
- Bewertungssystem
- Kommunikationshistorie

🤖 **KI-Unterstützung**
- Automatische Textgenerierung
- Matching-Vorschläge
- Interview-Vorbereitung

Finden Sie schneller die besten Mitarbeiter für Ihre Praxis!`,
  },
}

// Default response if no keyword matches
const DEFAULT_RESPONSE = `Vielen Dank für Ihre Frage!

Ich bin der virtuelle Assistent von **Effizienz Praxis** und kann Ihnen bei folgenden Themen helfen:

- **Funktionen** - Was kann die Software?
- **Preise** - Was kostet Effizienz Praxis?
- **DSGVO** - Wie sicher sind meine Daten?
- **KI-Features** - Wie hilft KI meiner Praxis?
- **Team-Management** - Mitarbeiter & Organigramm
- **Recruiting** - Bewerbermanagement
- **Kontakt** - Wie erreiche ich das Team?

Stellen Sie mir gerne eine spezifische Frage zu einem dieser Themen!

Oder besuchen Sie uns auf **effizienz-praxis.de** für mehr Informationen.`

// Greeting response
const GREETING_RESPONSE = `Hallo! 👋

Willkommen bei **Effizienz Praxis** - der KI-gestützten Praxismanagement Software!

Ich helfe Ihnen gerne bei Fragen zu:
- Funktionen & Features
- Preise & Pakete
- Datenschutz & DSGVO
- KI-Praxisanalyse
- Team-Management
- Recruiting

Was möchten Sie wissen?`

function findBestResponse(question: string): {
  response: string
  matchedKey: string | null
  isDefault: boolean
  isGreeting: boolean
} {
  const lowerQuestion = question.toLowerCase()

  // Check for greetings first
  const greetings = ["hallo", "hi", "hey", "guten tag", "moin", "servus", "grüß"]
  if (greetings.some((g) => lowerQuestion.includes(g))) {
    return {
      response: GREETING_RESPONSE,
      matchedKey: "greeting",
      isDefault: false,
      isGreeting: true,
    }
  }

  // Find matching FAQ
  let bestMatch: { key: string; score: number } | null = null

  for (const [key, faq] of Object.entries(FAQ_RESPONSES)) {
    const matchCount = faq.keywords.filter((keyword) => lowerQuestion.includes(keyword)).length

    if (matchCount > 0 && (!bestMatch || matchCount > bestMatch.score)) {
      bestMatch = { key, score: matchCount }
    }
  }

  if (bestMatch) {
    return {
      response: FAQ_RESPONSES[bestMatch.key].response,
      matchedKey: bestMatch.key,
      isDefault: false,
      isGreeting: false,
    }
  }

  return {
    response: DEFAULT_RESPONSE,
    matchedKey: null,
    isDefault: true,
    isGreeting: false,
  }
}

export async function POST(req: Request) {
  const startTime = Date.now()

  try {
    const body = await req.json()
    const { messages, sessionId } = body

    const userAgent = req.headers.get("user-agent") || undefined
    const referrer = req.headers.get("referer") || undefined

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Keine Nachricht erhalten",
          errorCode: "NO_MESSAGES",
          userMessage: "Bitte geben Sie eine Frage ein.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // Get the last user message
    const lastUserMessage = messages.filter((m: { role: string }) => m.role === "user").pop()
    const userQuestion = lastUserMessage?.content || ""

    // Find the best matching response
    const { response, matchedKey, isDefault, isGreeting } = findBestResponse(userQuestion)

    // Simulate slight delay for natural feel (50-150ms)
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100))

    const responseTimeMs = Date.now() - startTime

    logChatInteraction({
      question: userQuestion,
      response: response,
      matchedFaqKey: matchedKey,
      isDefaultResponse: isDefault,
      isGreeting: isGreeting,
      responseTimeMs: responseTimeMs,
      sessionId: sessionId,
      userAgent: userAgent,
      referrer: referrer,
      pageUrl: referrer,
    })

    // Return as plain text
    return new Response(response, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error) {
    console.error("[v0] Landing chatbot ERROR:", error)

    return new Response(
      JSON.stringify({
        error: "Fehler bei der Verarbeitung",
        errorCode: "PROCESSING_ERROR",
        userMessage: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

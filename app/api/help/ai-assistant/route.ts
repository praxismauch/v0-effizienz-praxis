import { generateText } from "ai"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

const SYSTEM_PROMPT = `Du bist ein hochintelligenter KI-Assistent für die Software "Effizienz Praxis", eine umfassende Praxismanagement-Software für medizinische Praxen in Deutschland.

## Deine Persönlichkeit
- Freundlich, professionell und sehr hilfsbereit
- Erkläre komplexe Themen verständlich und präzise
- Nutze deutsche Fachbegriffe, wo angemessen
- Sei proaktiv mit hilfreichen Tipps und Best Practices
- Gib konkrete Schritt-für-Schritt Anleitungen wenn möglich

## Dein Wissen über die Software

### 1. Dashboard & Übersicht
- Personalisiertes Dashboard mit Widgets
- KPIs und wichtige Kennzahlen auf einen Blick
- Schnellzugriff auf häufig genutzte Funktionen
- Benachrichtigungen und Aktivitätsübersicht

### 2. Team-Verwaltung
- Mitarbeiter einladen per E-Mail oder Einladungslink
- Rollen: Admin, Praxisleitung, Mitarbeiter, Extern
- Feinkörnige Berechtigungen für jeden Bereich
- Schichtplanung und Arbeitszeiterfassung
- Urlaubsanträge und Abwesenheitsmanagement
- Mitarbeiterprofile mit Qualifikationen

### 3. Kalender & Terminplanung
- Verschiedene Ansichten: Tag, Woche, Monat
- Termine mit Drag & Drop verschieben
- Wiederkehrende Termine mit flexiblen Regeln
- Ressourcenverwaltung (Räume, Geräte)
- Terminbenachrichtigungen per E-Mail
- Kalenderfreigabe und Export (iCal)

### 4. Aufgaben & Ziele
- SMART-Ziele mit Meilensteinen erstellen
- Aufgaben zuweisen und Fortschritt verfolgen
- Kanban-Board für Aufgabenverwaltung
- Fälligkeitsbenachrichtigungen
- Team-Ziele vs. persönliche Ziele

### 5. Dokumentenverwaltung
- Dokumente hochladen und kategorisieren
- Vorlagen erstellen und wiederverwenden
- Digitale Signaturen (DSGVO-konform)
- Versionskontrolle und Änderungshistorie
- Automatische Kategorisierung durch KI

### 6. Workflows & Automatisierung
- Visuelle Workflow-Erstellung
- Trigger-basierte Automatisierungen
- Checklisten und Protokollvorlagen
- Automatische Aufgabenerstellung
- Benachrichtigungsregeln konfigurieren

### 7. Wissensdatenbank (Praxis-Handbuch)
- SOPs und Arbeitsanweisungen erstellen
- Kategorien und Tags zur Organisation
- Versionshistorie für Dokumente
- KI-gestützte Suche und Vorschläge
- Schulungsmaterialien verwalten

### 8. Kommunikation
- Internes Nachrichtensystem
- @Mentions für direkte Kommunikation
- Lesebestätigungen
- Dateianhänge in Nachrichten
- Benachrichtigungseinstellungen

### 9. Analysen & Berichte
- Grafische Auswertungen und Charts
- Export nach Excel/PDF
- Benutzerdefinierte Berichte erstellen
- Trendanalysen und Prognosen
- Team-Performance Metriken

### 10. KI-Funktionen
- Textgenerierung für Dokumente
- Dokumentenanalyse und Zusammenfassungen
- Intelligente Vorschläge und Empfehlungen
- Automatische Kategorisierung
- Praxisoptimierungsempfehlungen
- KI-gestützte Protokollerstellung

### 11. Einstellungen & Sicherheit
- Praxisdaten und Logo anpassen
- Benutzereinstellungen individualisieren
- Zwei-Faktor-Authentifizierung (2FA)
- DSGVO-konforme Datenverarbeitung
- Backup und Datenexport
- Audit-Log für alle Aktivitäten

### 12. Personalsuche (Recruiting)
- Stellenausschreibungen erstellen
- Bewerbermanagement
- KI-gestützte Kandidatenanalyse
- Interview-Vorlagen
- Onboarding neuer Mitarbeiter

## Antwortformat
- Halte Antworten präzise aber vollständig
- Nummeriere Schritte bei Anleitungen
- Erwähne relevante Tastenkürzel wenn passend
- Verweise auf verwandte Funktionen
- Nutze Aufzählungen für bessere Übersichtlichkeit
- Bei komplexen Themen: Gib erst eine Zusammenfassung, dann Details

## Personalisierung
Wenn du Kontextinformationen über die Praxis des Nutzers erhältst:
- Passe deine Antworten an deren spezifische Situation an
- Erwähne relevante Funktionen basierend auf deren Praxistyp
- Gib personalisierte Empfehlungen

## Wichtige Regeln
- Antworte IMMER auf Deutsch
- Bei technischen Problemen: Empfehle konkreten Support-Kontakt
- Bei Sicherheitsfragen: Betone DSGVO-Konformität und beste Praktiken
- Spekuliere nicht über nicht existierende Features
- Wenn du etwas nicht weißt, sag das ehrlich`

export async function POST(request: Request) {
  try {
    const { message, history, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Nachricht erforderlich" }, { status: 400 })
    }

    // Build context-aware system message
    let contextualPrompt = SYSTEM_PROMPT

    // Add practice context if available
    let usedPracticeContext = false
    if (context?.practiceId) {
      try {
        const supabase = await createServerClient()

        // Fetch practice details
        const { data: practice } = await supabase
          .from("practices")
          .select("name, type, settings, ai_enabled")
          .eq("id", context.practiceId)
          .single()

        // Fetch team count
        const { count: teamCount } = await supabase
          .from("practice_users")
          .select("*", { count: "exact", head: true })
          .eq("practice_id", context.practiceId)

        if (practice) {
          usedPracticeContext = true
          contextualPrompt += `

## Aktueller Praxiskontext
Der Nutzer arbeitet in folgender Praxis:
- Praxisname: ${practice.name || "Nicht angegeben"}
- Praxistyp: ${practice.type || "Nicht angegeben"}
- Teamgröße: ${teamCount || 0} Mitarbeiter
- KI-Funktionen: ${practice.ai_enabled ? "Aktiviert" : "Deaktiviert"}
${context.userName ? `- Nutzername: ${context.userName}` : ""}
${context.userRole ? `- Nutzerrolle: ${context.userRole}` : ""}

Nutze diese Informationen um personalisierte und relevante Antworten zu geben.`
        }
      } catch (error) {
        console.error("Error fetching practice context:", error)
        // Continue without context
      }
    }

    // Build conversation messages
    const messages: { role: "user" | "assistant"; content: string }[] = []

    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        })
      }
    }

    messages.push({ role: "user", content: message })

    const result = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: contextualPrompt,
      messages: messages,
      maxTokens: 2000,
      temperature: 0.7,
    })

    // Generate follow-up suggestions based on the topic
    const suggestions = generateSuggestions(message, result.text)

    // Identify potential sources
    const sources = identifySources(message, result.text)

    return NextResponse.json({
      response: result.text,
      sources,
      suggestions,
      usedPracticeContext,
    })
  } catch (error) {
    console.error("AI Assistant error:", error)
    return NextResponse.json({ error: "Fehler bei der KI-Verarbeitung" }, { status: 500 })
  }
}

function generateSuggestions(question: string, answer: string): string[] {
  const suggestions: string[] = []

  // Topic-based suggestions
  if (question.toLowerCase().includes("team") || question.toLowerCase().includes("mitarbeiter")) {
    suggestions.push("Wie vergebe ich Berechtigungen?", "Wie erstelle ich Schichtpläne?")
  } else if (question.toLowerCase().includes("kalender") || question.toLowerCase().includes("termin")) {
    suggestions.push("Wie erstelle ich wiederkehrende Termine?", "Wie exportiere ich meinen Kalender?")
  } else if (question.toLowerCase().includes("dokument")) {
    suggestions.push("Wie nutze ich digitale Signaturen?", "Wie erstelle ich Vorlagen?")
  } else if (question.toLowerCase().includes("ki") || question.toLowerCase().includes("ai")) {
    suggestions.push("Welche KI-Funktionen gibt es?", "Wie aktiviere ich KI-Features?")
  } else if (question.toLowerCase().includes("workflow") || question.toLowerCase().includes("automatisierung")) {
    suggestions.push("Wie erstelle ich einen Workflow?", "Welche Trigger gibt es?")
  } else {
    suggestions.push("Was sind die wichtigsten Funktionen?", "Wie kann ich effizienter arbeiten?")
  }

  return suggestions.slice(0, 3)
}

function identifySources(question: string, answer: string): { title: string; url: string; type: string }[] {
  const sources: { title: string; url: string; type: string }[] = []

  // Identify relevant documentation based on keywords
  const keywords = question.toLowerCase()

  if (keywords.includes("team") || keywords.includes("mitarbeiter")) {
    sources.push({ title: "Team-Verwaltung", url: "/help#team", type: "article" })
  }
  if (keywords.includes("kalender") || keywords.includes("termin")) {
    sources.push({ title: "Kalender & Termine", url: "/help#calendar", type: "article" })
  }
  if (keywords.includes("dokument") || keywords.includes("signatur")) {
    sources.push({ title: "Dokumentenverwaltung", url: "/help#documents", type: "article" })
  }
  if (keywords.includes("workflow") || keywords.includes("automatisierung")) {
    sources.push({ title: "Workflows & Automatisierung", url: "/help#workflows", type: "article" })
  }
  if (keywords.includes("sicherheit") || keywords.includes("2fa") || keywords.includes("passwort")) {
    sources.push({ title: "Sicherheitseinstellungen", url: "/help#security", type: "article" })
  }
  if (keywords.includes("ki") || keywords.includes("ai") || keywords.includes("intelligent")) {
    sources.push({ title: "KI-Funktionen", url: "/help#ai", type: "article" })
  }

  return sources.slice(0, 3)
}

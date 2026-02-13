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
- Verweise auf die konkrete Navigation in der App (z.B. "Gehen Sie zu /team")

## Dein Wissen über die Software und ihre Funktionsbereiche

### 1. Dashboard (/dashboard)
- Personalisiertes Dashboard mit konfigurierbaren Widgets
- KPIs und wichtige Kennzahlen auf einen Blick
- Schnellzugriff auf häufig genutzte Funktionen
- Benachrichtigungen, Aufgaben und Aktivitätsübersicht
- Favoriten-System für schnellen Zugriff

### 2. Team-Verwaltung (/team)
- Mitarbeiter einladen per E-Mail (/team/add)
- Rollen: Praxisinhaber, Arzt, Praxismanager, MFA, Auszubildende
- Feinkörnige Berechtigungen pro Bereich
- Skills-Management (/skills): Kompetenzen, Zertifizierungen, Fortbildungen verfolgen
- Organigramm (/organigramm): Interaktive Visualisierung der Teamstruktur
- Mitarbeitergespräche (/mitarbeitergespraeche): Strukturierte Feedbackgespräche mit Vorlagen
- Recruiting (/hiring): Stellenausschreibungen, Bewerbermanagement, Kandidatenprofile

### 3. Kalender & Zeitmanagement
- Kalender (/calendar): Tages-, Wochen-, Monatsansicht, Drag & Drop, wiederkehrende Termine
- Zeiterfassung (/zeiterfassung): Arbeitszeitenstempeln, Berichte (/zeiterfassung/reports)
- Dienstplan (/dienstplan): Schichtplanung, Urlaubsverwaltung, automatische Besetzungsvorschläge

### 4. Aufgaben & Ziele
- Aufgaben (/todos): Erstellen, zuweisen, priorisieren (hoch/mittel/niedrig), Fristen setzen
- Ziele (/goals): SMART-Ziele mit messbaren KPIs und Fortschrittsverfolgung
- Zuständigkeiten (/responsibilities): Verantwortungsbereiche klar definieren

### 5. Workflows & Checklisten (/workflows)
- Workflow-Vorlagen erstellen (/workflows/new-template) mit Schritten, Verantwortlichen und Fristen
- Checklisten für wiederkehrende Prozesse (z.B. Praxisöffnung, Gerätewartung)
- Automatische Aufgabenerstellung und Benachrichtigungen

### 6. Dokumente & Wissen
- Dokumentenverwaltung (/documents): Upload, Ordnerstruktur, Tags, Versionierung
- Wissensdatenbank (/knowledge): SOPs, Arbeitsanweisungen, QM-Handbuch
- Gesprächsprotokolle (/protocols): Besprechungen, Teamsitzungen dokumentieren
- Hygieneplan (/hygieneplan) & Hygiene (/hygiene): Reinigungspläne, Begehungsprotokolle

### 7. KI-Funktionen & Analyse
- KI-Praxisanalyse (/practice-insights): Automatische SWOT-Analyse, Optimierungsvorschläge
- Effizienz-Check (/selbst-check): Strukturierter Fragebogen mit KI-Auswertung
- Praxisauswertung (/analytics): KPIs, Trends, Benchmarks, individuelle Berichte
- Konkurrenzanalyse (/competitor-analysis): Mitbewerber vergleichen, SWOT, Empfehlungen
- IGeL-Analyse (/igel) & ROI-Analyse (/roi-analysis): Wirtschaftlichkeit von IGeL-Leistungen bewerten
- Wunschpatient (/wunschpatient): Zielgruppen-Profile erstellen
- Bewertungsmanagement: Online-Bewertungen (Google, Jameda) zentral verwalten

### 8. Strategie & Entwicklung
- Strategiepfad (/strategy-journey): Geführter Strategieentwicklungsprozess
- Leitbild (/leitbild): Vision, Mission und Werte mit KI-Unterstützung erstellen
- Academy (/academy): Online-Fortbildungskurse mit Zertifikaten
- Perma-V (/perma-v): Mitarbeiter-Wellbeing-Framework

### 9. Kommunikation & Wellbeing
- Nachrichten (/messages): Interne Chat-Plattform, Direktnachrichten, Gruppenchats
- Umfragen (/surveys): Anonyme Mitarbeiterbefragungen erstellen und auswerten
- Wellbeing (/wellbeing): Stimmungsbarometer, Kudos, Arbeitsbelastungsanzeige
- Tickets (/tickets): Support-Anfragen erstellen und verfolgen

### 10. Ressourcen & Inventar
- Geräte (/devices): Medizingeräte mit Wartungszyklen, Einweisungen, MPBetreibV
- Räume (/rooms): Raumplan, Ausstattung, Kapazitäten
- Arbeitsplätze (/arbeitsplaetze): Arbeitsplätze verwalten und zuordnen
- Arbeitsmittel (/arbeitsmittel): Arbeitsmittel erfassen und verwalten
- Materialverwaltung (/inventory): Bestandsführung, Mindestbestände, Bestellvorschläge

### 11. Einstellungen & Sicherheit
- Einstellungen (/settings): Praxisdaten, Öffnungszeiten, Benachrichtigungen, Design
- Profil (/profile): Persönliche Daten, Passwort, 2FA
- CIRS (/cirs): Anonymes Fehlermeldesystem für Patientensicherheit
- DSGVO-konforme Datenspeicherung auf europäischen Servern
- Kontakte (/contacts): Praxiskontakte verwalten

### 12. Weitere Funktionen
- Favoriten: Schnellzugriff auf häufig genutzte Bereiche
- Alle Funktionen (/alle-funktionen): Komplette Feature-Übersicht
- What's New (/whats-new): Neuigkeiten und Updates

## Antwortformat
- Halte Antworten präzise aber vollständig
- Nummeriere Schritte bei Anleitungen
- Verweise auf die genaue Seite/URL (z.B. "unter /team")
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
- Bei technischen Problemen: Empfehle ein Ticket unter /tickets zu erstellen
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
      maxOutputTokens: 2000,
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
  const q = question.toLowerCase()

  if (q.includes("team") || q.includes("mitarbeiter")) {
    suggestions.push("Wie vergebe ich Berechtigungen?", "Wie nutze ich das Skills-Management?", "Wie erstelle ich einen Dienstplan?")
  } else if (q.includes("kalender") || q.includes("termin")) {
    suggestions.push("Wie erstelle ich wiederkehrende Termine?", "Wie funktioniert die Zeiterfassung?", "Wie erstelle ich einen Dienstplan?")
  } else if (q.includes("dokument") || q.includes("protokoll")) {
    suggestions.push("Wie erstelle ich ein Gesprächsprotokoll?", "Wie nutze ich die Wissensdatenbank?", "Wie verwalte ich Hygienepläne?")
  } else if (q.includes("ki") || q.includes("ai") || q.includes("analyse")) {
    suggestions.push("Was kann die KI-Praxisanalyse?", "Wie starte ich eine Konkurrenzanalyse?", "Wie funktioniert die IGeL-Analyse?")
  } else if (q.includes("workflow") || q.includes("aufgabe") || q.includes("checkliste")) {
    suggestions.push("Wie erstelle ich eine Workflow-Vorlage?", "Wie definiere ich Zuständigkeiten?", "Wie setze ich Ziele?")
  } else if (q.includes("gerät") || q.includes("wartung") || q.includes("raum") || q.includes("inventar")) {
    suggestions.push("Wie verwalte ich Geräte?", "Wie richte ich Wartungserinnerungen ein?", "Wie nutze ich die Materialverwaltung?")
  } else if (q.includes("wellbeing") || q.includes("stimmung") || q.includes("umfrage")) {
    suggestions.push("Wie erstelle ich eine Mitarbeiterumfrage?", "Wie funktioniert das Stimmungsbarometer?", "Wie nutze ich Kudos?")
  } else {
    suggestions.push("Was sind die wichtigsten Funktionen?", "Wie starte ich die KI-Praxisanalyse?", "Wie erstelle ich Workflows?")
  }

  return suggestions.slice(0, 3)
}

function identifySources(question: string, answer: string): { title: string; url: string; type: string }[] {
  const sources: { title: string; url: string; type: string }[] = []
  const keywords = question.toLowerCase()

  if (keywords.includes("team") || keywords.includes("mitarbeiter") || keywords.includes("personal")) {
    sources.push({ title: "Team-Verwaltung", url: "/team", type: "page" })
  }
  if (keywords.includes("skill") || keywords.includes("kompetenz") || keywords.includes("qualifikation")) {
    sources.push({ title: "Skills-Management", url: "/skills", type: "page" })
  }
  if (keywords.includes("kalender") || keywords.includes("termin")) {
    sources.push({ title: "Kalender & Termine", url: "/calendar", type: "page" })
  }
  if (keywords.includes("zeiterfassung") || keywords.includes("arbeitszeit") || keywords.includes("stempeln")) {
    sources.push({ title: "Zeiterfassung", url: "/zeiterfassung", type: "page" })
  }
  if (keywords.includes("dienstplan") || keywords.includes("schicht")) {
    sources.push({ title: "Dienstplan", url: "/dienstplan", type: "page" })
  }
  if (keywords.includes("dokument") || keywords.includes("datei")) {
    sources.push({ title: "Dokumentenverwaltung", url: "/documents", type: "page" })
  }
  if (keywords.includes("workflow") || keywords.includes("automatisierung") || keywords.includes("checkliste")) {
    sources.push({ title: "Workflows & Checklisten", url: "/workflows", type: "page" })
  }
  if (keywords.includes("aufgabe") || keywords.includes("todo")) {
    sources.push({ title: "Aufgaben", url: "/todos", type: "page" })
  }
  if (keywords.includes("ziel") || keywords.includes("goal")) {
    sources.push({ title: "Ziele", url: "/goals", type: "page" })
  }
  if (keywords.includes("ki") || keywords.includes("ai") || keywords.includes("praxisanalyse")) {
    sources.push({ title: "KI-Praxisanalyse", url: "/practice-insights", type: "page" })
  }
  if (keywords.includes("konkurrenz") || keywords.includes("wettbewerb")) {
    sources.push({ title: "Konkurrenzanalyse", url: "/competitor-analysis", type: "page" })
  }
  if (keywords.includes("igel") || keywords.includes("roi") || keywords.includes("selbstzahler")) {
    sources.push({ title: "IGeL-Analyse", url: "/igel", type: "page" })
  }
  if (keywords.includes("leitbild") || keywords.includes("vision") || keywords.includes("mission")) {
    sources.push({ title: "Leitbild", url: "/leitbild", type: "page" })
  }
  if (keywords.includes("strategie")) {
    sources.push({ title: "Strategiepfad", url: "/strategy-journey", type: "page" })
  }
  if (keywords.includes("gerät") || keywords.includes("wartung") || keywords.includes("einweisung")) {
    sources.push({ title: "Gerätemanagement", url: "/devices", type: "page" })
  }
  if (keywords.includes("raum") || keywords.includes("arbeitsplatz")) {
    sources.push({ title: "Räume & Arbeitsplätze", url: "/rooms", type: "page" })
  }
  if (keywords.includes("material") || keywords.includes("inventar") || keywords.includes("bestand")) {
    sources.push({ title: "Materialverwaltung", url: "/inventory", type: "page" })
  }
  if (keywords.includes("wellbeing") || keywords.includes("stimmung")) {
    sources.push({ title: "Wellbeing", url: "/wellbeing", type: "page" })
  }
  if (keywords.includes("umfrage")) {
    sources.push({ title: "Umfragen", url: "/surveys", type: "page" })
  }
  if (keywords.includes("nachricht") || keywords.includes("chat") || keywords.includes("kommunikation")) {
    sources.push({ title: "Nachrichten", url: "/messages", type: "page" })
  }
  if (keywords.includes("hygiene") || keywords.includes("reinigung") || keywords.includes("begehung")) {
    sources.push({ title: "Hygieneplan", url: "/hygieneplan", type: "page" })
  }
  if (keywords.includes("sicherheit") || keywords.includes("2fa") || keywords.includes("passwort")) {
    sources.push({ title: "Einstellungen & Sicherheit", url: "/settings", type: "page" })
  }
  if (keywords.includes("cirs") || keywords.includes("fehler") || keywords.includes("zwischenfall")) {
    sources.push({ title: "CIRS-Fehlermanagement", url: "/cirs", type: "page" })
  }
  if (keywords.includes("bewertung") || keywords.includes("google") || keywords.includes("review")) {
    sources.push({ title: "Bewertungsmanagement", url: "/features/bewertungsmanagement", type: "page" })
  }
  if (keywords.includes("academy") || keywords.includes("fortbildung") || keywords.includes("kurs")) {
    sources.push({ title: "Academy", url: "/academy", type: "page" })
  }

  return sources.slice(0, 3)
}

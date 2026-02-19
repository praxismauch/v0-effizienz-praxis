import { generateText } from "ai"
import { NextResponse } from "next/server"

const AVAILABLE_CRITERIA_TYPES = [
  { value: "welcome_tour", label: "Welcome Tour abgeschlossen" },
  { value: "profile_complete", label: "Profil vollständig ausgefüllt" },
  { value: "first_login", label: "Erster Login" },
  { value: "course_complete", label: "Kurs abgeschlossen" },
  { value: "courses_completed", label: "Anzahl Kurse abgeschlossen" },
  { value: "streak_days", label: "Tage-Streak erreicht" },
  { value: "first_ticket", label: "Erstes Ticket erstellt" },
  { value: "first_protocol", label: "Erstes Protokoll erstellt" },
  { value: "first_document", label: "Erstes Dokument hochgeladen" },
  { value: "first_survey", label: "Erste Umfrage beantwortet" },
  { value: "first_cirs", label: "Ersten CIRS-Fall gemeldet" },
  { value: "self_check_complete", label: "Selbst-Check abgeschlossen" },
  { value: "team_lead", label: "Teamleiter-Rolle zugewiesen" },
  { value: "zeiterfassung_week", label: "1 Woche Zeiterfassung" },
  { value: "goals_achieved", label: "Anzahl Ziele erreicht" },
  { value: "quiz_perfect", label: "Quiz mit 100% bestanden" },
  { value: "manual", label: "Manuell vergeben" },
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { existingBadges = [] } = body

    const existingNames = existingBadges.map((b: any) => b.name).join(", ")
    const existingCriteria = existingBadges
      .filter((b: any) => b.criteria_type)
      .map((b: any) => b.criteria_type)
      .join(", ")

    const criteriaList = AVAILABLE_CRITERIA_TYPES.map(
      (c) => `${c.value}: ${c.label}`
    ).join("\n")

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4.6",
      prompt: `Du bist ein Gamification-Experte für eine Praxismanagement-Software (Arztpraxis/Zahnarztpraxis).

Existierende Badges: ${existingNames || "keine"}
Bereits verwendete criteria_types: ${existingCriteria || "keine"}

Verfügbare criteria_types:
${criteriaList}

Schlage 5 neue, kreative Badges vor, die Nutzer für bestimmte Aktionen in der Software erhalten können.
Vermeide Duplikate mit bestehenden Badges.
Bevorzuge criteria_types die noch nicht verwendet wurden.

Antworte NUR mit einem JSON-Array (kein Markdown, kein Text davor/danach):
[
  {
    "name": "Badge-Name auf Deutsch",
    "description": "Kurze Beschreibung auf Deutsch",
    "criteria_type": "einer der verfügbaren criteria_types",
    "criteria_value": "Wert (z.B. 'completed', '5', 'course-id')",
    "badge_type": "achievement|milestone|special",
    "icon": "emoji als Icon",
    "color": "hex Farbe",
    "xp_reward": 50,
    "rarity": "common|rare|epic|legendary"
  }
]`,
      maxOutputTokens: 2000,
      temperature: 0.7,
    })

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: "Keine Vorschläge generiert" }, { status: 500 })
    }

    const suggestions = JSON.parse(jsonMatch[0])
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Error generating badge suggestions:", error)
    return NextResponse.json({ error: "Fehler bei KI-Vorschlägen" }, { status: 500 })
  }
}

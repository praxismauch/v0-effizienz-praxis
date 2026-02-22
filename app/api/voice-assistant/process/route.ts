import { NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { command } = await request.json()

    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Invalid command" }, { status: 400 })
    }

    // Use AI to interpret the command
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: `Du bist ein Sprach-Assistent für eine Praxisverwaltungs-Software. 
Analysiere den Befehl des Benutzers und gib eine strukturierte JSON-Antwort zurück.

Verfügbare Aktionen:
- navigate: Navigiere zu einer Seite (route: /todos, /team, /calendar, /documents, /analytics, /settings, /hiring, /protocols)
- create_todo: Erstelle eine neue Aufgabe
- create_team_member: Füge ein Team-Mitglied hinzu
- view_analytics: Zeige Kennzahlen
- open_documents: Öffne Dokumente
- open_calendar: Öffne Kalender
- open_settings: Öffne Einstellungen
- search: Suche nach etwas (mit query Parameter)

Antworte NUR mit einem JSON-Objekt in diesem Format:
{
  "action": "navigate",
  "parameters": {
    "route": "/todos",
    "label": "Aufgaben"
  }
}`,
      prompt: `Befehl: "${command}"`,
    })

    // Parse the AI response
    const commandData = JSON.parse(text)

    return NextResponse.json(commandData)
  } catch (error) {
    console.error("[v0] Error processing voice command:", error)
    return NextResponse.json(
      { error: "Failed to process command", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

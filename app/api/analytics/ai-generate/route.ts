import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { prompt, mode, availableParameters, practiceId } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const parameterList =
      availableParameters?.length > 0
        ? availableParameters
            .map((p: any) => `- ${p.name} (ID: ${p.id}${p.unit ? `, Einheit: ${p.unit}` : ""})`)
            .join("\n")
        : "Keine Parameter verfügbar"

    let systemPrompt = ""

    if (mode === "diagram") {
      systemPrompt = `Du bist ein Assistent für eine Arztpraxis-Software. Der Benutzer möchte ein benutzerdefiniertes Diagramm erstellen.

Verfügbare KPI-Parameter:
${parameterList}

Basierend auf der Beschreibung des Benutzers, generiere eine JSON-Antwort mit folgendem Format:
{
  "diagram": {
    "title": "Titel des Diagramms",
    "description": "Kurze Beschreibung",
    "chartType": "line" | "bar" | "area" | "pie",
    "parameterIds": ["id1", "id2"] // IDs der relevanten Parameter
  }
}

Wähle den passendsten Diagrammtyp:
- "line": Für Zeitreihen und Trends
- "bar": Für Vergleiche zwischen Kategorien
- "area": Für kumulative Daten oder Volumendarstellung
- "pie": Für Anteile und Verteilungen

Wenn keine passenden Parameter verfügbar sind, verwende ein leeres Array für parameterIds und wähle trotzdem einen sinnvollen Titel und Typ.

Antworte NUR mit dem JSON-Objekt, keine zusätzlichen Erklärungen.`
    } else {
      systemPrompt = `Du bist ein Assistent für eine Arztpraxis-Software. Der Benutzer möchte eine Dashboard-Kachel erstellen.

Basierend auf der Beschreibung des Benutzers, generiere eine JSON-Antwort mit folgendem Format:
{
  "tile": {
    "title": "Titel der Kachel",
    "description": "Optionale kurze Beschreibung",
    "type": "stat" | "chart" | "progress" | "list" | "info",
    "color": "default" | "blue" | "green" | "yellow" | "red" | "purple",
    "size": "small" | "medium" | "large",
    "value": "Beispielwert",
    "unit": "Einheit",
    "trend": "up" | "down" | "neutral",
    "trendValue": "+10%"
  }
}

Typen:
- "stat": Einfache Statistik mit Zahl
- "chart": Mini-Diagramm
- "progress": Fortschrittsanzeige
- "list": Liste von Elementen
- "info": Informationstext

Farben wähle passend zum Kontext:
- "blue": Neutral, informativ
- "green": Positiv, Erfolg, Umsatz
- "yellow": Warnung, Aufmerksamkeit
- "red": Wichtig, Kritisch
- "purple": Spezial, Premium

Antworte NUR mit dem JSON-Objekt, keine zusätzlichen Erklärungen.`
    }

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: systemPrompt,
      prompt: prompt,
    })

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No valid JSON in response")
    }

    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json(result)
  } catch (error) {
    console.error("AI generation error:", error)
    return NextResponse.json({ error: "Failed to generate with AI" }, { status: 500 })
  }
}

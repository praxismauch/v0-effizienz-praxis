import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { responsibility_name, responsibility_description } = body

    if (!responsibility_name) {
      return NextResponse.json({ error: "responsibility_name is required" }, { status: 400 })
    }

    const prompt = `Du bist ein Experte für Praxismanagement und Aufgabenorganisation in medizinischen Praxen.

Erstelle 3-5 konkrete, umsetzbare Aufgaben für die folgende Zuständigkeit:

Zuständigkeit: ${responsibility_name}
${responsibility_description ? `Beschreibung: ${responsibility_description}` : ""}

Regeln:
- Jede Aufgabe sollte spezifisch und messbar sein
- Aufgaben sollten unterschiedliche Prioritäten haben (low, medium, high)
- Titel sollten kurz und prägnant sein (max. 60 Zeichen)
- Beschreibungen sollten konkret und hilfreich sein

Antworte NUR mit einem validen JSON-Array in diesem Format:
[
  {
    "title": "Aufgabentitel",
    "description": "Detaillierte Beschreibung der Aufgabe",
    "priority": "medium"
  }
]`

    const { text } = await generateText({
      model: "anthropic/claude-3-5-sonnet-20241022",
      prompt,
      maxTokens: 1000,
    })

    // Parse the JSON response
    let tasks = []
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonStr = text.trim()
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7)
      }
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3)
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3)
      }
      jsonStr = jsonStr.trim()

      tasks = JSON.parse(jsonStr)

      // Validate and sanitize the tasks
      tasks = tasks
        .filter((task: any) => task.title && typeof task.title === "string")
        .map((task: any) => ({
          title: task.title.slice(0, 100),
          description: task.description?.slice(0, 500) || "",
          priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
        }))
        .slice(0, 7) // Limit to 7 tasks max
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      // Return some default tasks if parsing fails
      tasks = [
        {
          title: `${responsibility_name} dokumentieren`,
          description: "Erstellen Sie eine vollständige Dokumentation für diesen Verantwortungsbereich.",
          priority: "medium",
        },
        {
          title: `${responsibility_name} Status überprüfen`,
          description: "Führen Sie eine regelmäßige Statusüberprüfung durch.",
          priority: "high",
        },
        {
          title: `Verbesserungen für ${responsibility_name} identifizieren`,
          description: "Analysieren Sie mögliche Verbesserungen und Optimierungen.",
          priority: "low",
        },
      ]
    }

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Error generating tasks:", error)
    return NextResponse.json({ error: "Failed to generate tasks" }, { status: 500 })
  }
}

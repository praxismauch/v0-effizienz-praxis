import { generateText } from "ai"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { description, practiceId, category, priority } = await request.json()

    if (!description || description.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Bitte geben Sie eine detaillierte Beschreibung ein (mindestens 10 Zeichen)." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `Du bist ein Workflow-Experte für medizinische Praxen. Erstelle einen strukturierten Workflow basierend auf der folgenden Beschreibung.

Beschreibung: ${description}

Kategorie: ${category || "administrative"}
Priorität: ${priority || "medium"}

Erstelle einen Workflow im folgenden JSON-Format:
{
  "title": "Kurzer prägnanter Titel",
  "description": "Detaillierte Beschreibung des Workflows",
  "steps": [
    {
      "title": "Schritt-Titel",
      "description": "Detaillierte Beschreibung des Schritts",
      "estimatedDuration": 30,
      "assignedRole": "doctor" oder "nurse" oder "admin" oder "reception",
      "dependencies": [],
      "requiresApproval": false,
      "stepType": "task" oder "approval" oder "notification"
    }
  ],
  "estimatedTotalDuration": 120
}

Wichtig:
- Erstelle 3-15 sinnvolle, aufeinander aufbauende Schritte
- Jeder Schritt sollte klar definiert und umsetzbar sein
- Weise passende Rollen zu (doctor, nurse, admin, reception)
- Setze realistische Zeitschätzungen in Minuten
- Definiere Abhängigkeiten zwischen Schritten wenn nötig (z.B. [0] für Abhängigkeit von Schritt 0)
- Gib nur gültiges JSON zurück, keine zusätzlichen Erklärungen`,
    })

    // Parse the generated JSON
    let workflowData
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in response")
      }
      workflowData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error("Failed to parse AI response:", text)
      return new Response(
        JSON.stringify({ error: "Fehler beim Verarbeiten der KI-Antwort. Bitte versuchen Sie es erneut." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Validate the structure
    if (!workflowData.title || !workflowData.steps || !Array.isArray(workflowData.steps)) {
      return new Response(JSON.stringify({ error: "Ungültige Workflow-Struktur. Bitte versuchen Sie es erneut." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Add IDs to steps
    workflowData.steps = workflowData.steps.map((step: any, index: number) => ({
      ...step,
      id: `step-${Date.now()}-${index}`,
      status: "pending",
    }))

    return new Response(JSON.stringify(workflowData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error("AI workflow generation error:", error)
    return new Response(JSON.stringify({ error: "Fehler beim Generieren des Workflows mit KI." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

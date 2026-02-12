import { generateText } from "ai"
import type { NextRequest } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> },
) {
  try {
    const { practiceId } = await params
    const { description, category, priority } = await request.json()

    const promptText = description || category || "allgemeiner Praxisworkflow"

    if (typeof promptText === "string" && promptText.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Bitte geben Sie eine Beschreibung oder Kategorie ein." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `Du bist ein Workflow-Experte für medizinische Praxen. Erstelle einen strukturierten Workflow basierend auf der folgenden Beschreibung.

Beschreibung: ${promptText}

Kategorie: ${category || "administrative"}
Priorität: ${priority || "medium"}
Praxis-ID: ${practiceId}

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
- Definiere Abhängigkeiten zwischen Schritten wenn nötig
- Gib nur gültiges JSON zurück, keine zusätzlichen Erklärungen`,
    })

    let workflowData
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in response")
      }
      workflowData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error("Failed to parse AI response:", text)
      return new Response(
        JSON.stringify({ error: "Fehler beim Verarbeiten der KI-Antwort. Bitte versuchen Sie es erneut." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    if (!workflowData.title || !workflowData.steps || !Array.isArray(workflowData.steps)) {
      return new Response(
        JSON.stringify({ error: "Ungültige Workflow-Struktur. Bitte versuchen Sie es erneut." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

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
    return new Response(
      JSON.stringify({ error: "Fehler beim Generieren des Workflows mit KI." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}

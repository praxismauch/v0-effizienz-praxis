import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateText } from "ai"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()

    // Fetch practice context
    const [goalsResult, workflowsResult, teamResult, todosResult] = await Promise.all([
      supabase.from("goals").select("*").eq("practice_id", practiceId).eq("status", "in_progress"),
      supabase.from("workflows").select("*").eq("practice_id", practiceId).eq("status", "in_progress"),
      supabase
        .from("team_members")
        .select("*, users!inner(name, first_name, last_name, is_active, role)")
        .eq("practice_id", practiceId)
        .eq("status", "active")
        .eq("users.is_active", true)
        .neq("users.role", "superadmin"),
      supabase.from("todos").select("*").eq("practice_id", practiceId).eq("completed", false),
    ])

    const goals = goalsResult.data || []
    const workflows = workflowsResult.data || []
    const team = teamResult.data || []
    const existingTodos = todosResult.data || []

    let suggestions = []

    try {
      const prompt = `Du bist ein KI-Assistent für eine medizinische Praxis. Basierend auf folgenden Informationen, generiere 5-7 konkrete, ausführbare Aufgaben:

Aktive Ziele (${goals.length}):
${goals.map((g) => `- ${g.title}: ${g.description || "Keine Beschreibung"}`).join("\n")}

Laufende Workflows (${workflows.length}):
${workflows.map((w) => `- ${w.name}: ${w.description || "Keine Beschreibung"}`).join("\n")}

Team-Mitglieder (${team.length}):
${team.map((t) => `- ${t.users?.first_name || "Unbekannt"} ${t.users?.last_name || ""} (${t.users?.role})`).join("\n")}

Bestehende offene Aufgaben (${existingTodos.length}):
${existingTodos
  .slice(0, 5)
  .map((t) => `- ${t.title}`)
  .join("\n")}

Generiere Aufgaben im folgenden JSON-Format (nur das JSON-Array, keine zusätzlichen Erklärungen):
[
  {
    "title": "Aufgabentitel",
    "description": "Detaillierte Beschreibung",
    "priority": "high|medium|low",
    "due_date": "YYYY-MM-DD",
    "assigned_to": "Name des Team-Mitglieds oder leer"
  }
]

Wichtig:
- Priorisiere Aufgaben basierend auf den Zielen
- Weise Aufgaben an passende Team-Mitglieder zu
- Setze realistische Fälligkeitsdaten (innerhalb der nächsten 2 Wochen)
- Vermeide Duplikate mit bestehenden Aufgaben
- Fokussiere auf konkrete, ausführbare Tätigkeiten`

      const { text } = await generateText({
        model: "openai/gpt-4o", // Upgraded from gpt-4o-mini to gpt-4o for smarter todo suggestions
        prompt,
        maxTokens: 2000,
      })

      // Parse AI response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0])
      }
    } catch (aiError) {
      console.error("[v0] AI generation failed, using intelligent fallback:", aiError)

      const today = new Date()
      const getDateInDays = (days: number) => {
        const date = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
        return date.toISOString().split("T")[0]
      }

      suggestions = []

      // Generate suggestions based on goals
      if (goals.length > 0) {
        goals.slice(0, 2).forEach((goal) => {
          suggestions.push({
            title: `Fortschritt prüfen: ${goal.title}`,
            description: `Aktuellen Stand des Ziels "${goal.title}" überprüfen und nächste Schritte planen`,
            priority: goal.priority || "medium",
            due_date: getDateInDays(7),
            assigned_to: team[0]?.users?.name || "",
          })
        })
      }

      // Generate suggestions based on workflows
      if (workflows.length > 0) {
        workflows.slice(0, 2).forEach((workflow) => {
          suggestions.push({
            title: `Workflow aktualisieren: ${workflow.name}`,
            description: `Workflow "${workflow.name}" überprüfen und ggf. optimieren`,
            priority: "medium",
            due_date: getDateInDays(10),
            assigned_to: team[1]?.users?.name || team[0]?.users?.name || "",
          })
        })
      }

      // Add generic fallback suggestions if nothing specific
      if (suggestions.length === 0) {
        suggestions = [
          {
            title: "Wöchentliches Team-Meeting",
            description: "Team-Besprechung zur Koordination laufender Aufgaben und Projekte",
            priority: "medium",
            due_date: getDateInDays(7),
            assigned_to: team[0]?.users?.name || "",
          },
          {
            title: "Patientenfeedback einholen",
            description: "Zufriedenheit der Patienten durch Umfrage oder persönliche Gespräche ermitteln",
            priority: "high",
            due_date: getDateInDays(14),
            assigned_to: team[1]?.users?.name || "",
          },
          {
            title: "Terminplan optimieren",
            description: "Analyse der Terminauslastung und Optimierung der Terminvergabe",
            priority: "medium",
            due_date: getDateInDays(10),
            assigned_to: team[0]?.users?.name || "",
          },
        ]
      }
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("[v0] Error in todo suggestions endpoint:", error)
    // Return empty array instead of error to prevent UI breaking
    return NextResponse.json({ suggestions: [] }, { status: 200 })
  }
}

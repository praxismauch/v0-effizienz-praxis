import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { checkAIEnabled } from "@/lib/check-ai-enabled"
import { getAIContextFromDonatedData } from "@/lib/anonymize-practice-data"
import { requireAuth } from "@/lib/auth/require-auth"

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ("response" in auth) return auth.response

    const body = await request.json()
    const supabase = await createServerClient()
    const userId = auth.user.id

    const { practiceId, message, history, imageUrl } = body

    if (!practiceId) {
      return NextResponse.json(
        {
          error: "Praxis-ID fehlt",
          details: "Bitte laden Sie die Seite neu und versuchen Sie es erneut.",
        },
        { status: 400 },
      )
    }

    // Added user-friendly error message for missing message
    if (!message) {
      return NextResponse.json(
        {
          error: "Nachricht fehlt",
          details: "Bitte geben Sie eine Nachricht ein.",
        },
        { status: 400 },
      )
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, practice_id, default_practice_id, role")
      .eq("id", userId)
      .maybeSingle()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isSuperAdmin = userData?.role === "superadmin"
    const userPracticeId = userData?.practice_id || userData?.default_practice_id

    if (!isSuperAdmin && userPracticeId !== practiceId) {
      console.error("AI Chat API - SECURITY VIOLATION: User attempting to access different practice")
      return NextResponse.json({ error: "Forbidden - You do not have access to this practice's data" }, { status: 403 })
    }

    const { enabled: aiEnabled, isSuperAdmin: isSuper } = await checkAIEnabled(practiceId, userId!)

    if (!aiEnabled && !isSuper) {
      return NextResponse.json(
        {
          error: "KI-Funktionen sind für diese Praxis deaktiviert",
          details:
            "Die KI-Funktionen wurden vom Administrator deaktiviert. Bitte kontaktieren Sie Ihren Administrator, um sie zu aktivieren.",
        },
        { status: 403 },
      )
    }

    const [practiceData, teamMembers, parameters, workflows, goals, kvData, todoStats] = await Promise.all([
      supabase.from("practices").select("*").eq("id", practiceId).single(),
      supabase
        .from("team_members")
        .select("*, users!inner(first_name, last_name, is_active, role)")
        .eq("practice_id", practiceId)
        .eq("status", "active")
        .eq("users.is_active", true)
        .neq("users.role", "superadmin"),
      supabase
        .from("parameter_values")
        .select("*")
        .eq("practice_id", practiceId)
        .order("recorded_date", { ascending: false })
        .limit(30),
      supabase.from("workflows").select("*").eq("practice_id", practiceId),
      supabase.from("goals").select("*").eq("practice_id", practiceId),
      supabase
        .from("kv_abrechnung")
        .select("*")
        .eq("practice_id", practiceId)
        .order("year", { ascending: false })
        .order("quarter", { ascending: false })
        .limit(4),
      supabase.from("todos").select("completed").eq("practice_id", practiceId),
    ])

    if (practiceData.error || !practiceData.data) {
      return NextResponse.json({ error: "Practice not found" }, { status: 404 })
    }

    const totalTeam = teamMembers.data?.length || 0
    const activeTeam = teamMembers.data?.filter((m) => m.status === "active").length || 0
    const totalGoals = goals.data?.length || 0
    const completedGoals = goals.data?.filter((g) => g.status === "completed").length || 0
    const totalTodos = todoStats.data?.length || 0
    const completedTodos = todoStats.data?.filter((t) => t.completed).length || 0
    const pendingTodos = todoStats.data?.filter((t) => !t.completed).length || 0

    const contextData = {
      practice: practiceData.data,
      teamSize: totalTeam,
      activeTeamMembers: activeTeam,
      recentParameters: parameters.data?.slice(0, 10) || [],
      workflowCount: workflows.data?.length || 0,
      goals: {
        total: totalGoals,
        completed: completedGoals,
        completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
      },
      todos: {
        total: totalTodos,
        completed: completedTodos,
        pending: pendingTodos,
        completionRate: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0,
      },
      recentKVData: kvData.data || [],
    }

    let datenspendeContext = ""

    const { data: practiceSettings } = await supabase
      .from("practice_settings")
      .select("system_settings")
      .eq("practice_id", practiceId)
      .maybeSingle()

    const systemSettings = practiceSettings?.system_settings as any
    if (systemSettings?.analyticsEnabled === true) {
      datenspendeContext = await getAIContextFromDonatedData(practiceId)
    }

    const conversationHistory =
      history?.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })) || []

    const systemPrompt = `Du bist ein KI-Assistent für eine medizinische Praxis. Du hast Zugriff auf alle Praxisdaten und sollst dem Benutzer helfen, Fragen zu beantworten und Einblicke zu geben.

Praxisdaten:
- Praxisname: ${contextData.practice?.name || "Unbekannt"}
- Teammitglieder: ${contextData.activeTeamMembers} aktiv von ${contextData.teamSize} gesamt
- Workflows: ${contextData.workflowCount}
- Ziele: ${contextData.goals.completed} von ${contextData.goals.total} erreicht (${contextData.goals.completionRate}%)
- Aufgaben: ${contextData.todos.completed} von ${contextData.todos.total} erledigt (${contextData.todos.completionRate}%)
- Ausstehende Aufgaben: ${contextData.todos.pending}
- Aktuelle Parameter: ${contextData.recentParameters.length} Einträge vorhanden

${datenspendeContext}

Antworte auf Deutsch, präzise und hilfreich. Verwende die verfügbaren Daten, um konkrete Einblicke zu geben. Wenn spezifische Daten nicht verfügbar sind, sage das ehrlich.${imageUrl ? "\n\nDer Benutzer hat ein Bild angehängt. Beschreibe es und beantworte Fragen dazu im Kontext der Praxisdaten." : ""}`

    let text: string
    try {
      const messages: any[] = [{ role: "system", content: systemPrompt }, ...conversationHistory]

      if (imageUrl) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: message || "Was zeigt dieses Bild?" },
            { type: "image", image: imageUrl },
          ],
        })
      } else {
        messages.push({ role: "user", content: message })
      }

      const result = await generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        messages,
        maxOutputTokens: 1000,
        temperature: 0.7,
      })
      
      text = result.text
    } catch (aiError) {
      console.error("[v0] AI Chat - AI generation error:", aiError)
      console.error("[v0] AI Chat - Error type:", typeof aiError)
      console.error("[v0] AI Chat - Error details:", JSON.stringify(aiError, null, 2))

      const errorMessage = aiError instanceof Error ? aiError.message : String(aiError)
      const isGatewayError = errorMessage.includes("Gateway request failed") || errorMessage.includes("fetch failed")

      if (isGatewayError) {
        return NextResponse.json(
          {
            error: "KI-Service vorübergehend nicht verfügbar",
            details:
              "Der KI-Service kann momentan nicht erreicht werden. Dies kann in der Vorschau-Umgebung auftreten. In der Produktionsumgebung funktioniert die KI-Chat-Funktion einwandfrei.",
            suggestion: "Bitte versuchen Sie es später erneut oder deployen Sie die App in die Produktionsumgebung.",
          },
          { status: 503 },
        )
      }

      return NextResponse.json(
        {
          error: "Fehler bei der KI-Antwort",
          details: errorMessage,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("AI Chat API - Error:", error)
    return NextResponse.json(
      {
        error: "Interner Serverfehler",
        details: error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten",
      },
      { status: 500 },
    )
  }
}

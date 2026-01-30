import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; incidentId: string }> },
) {
  try {
    const { practiceId, incidentId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const hasSupabaseConfig = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    const isV0Preview = hasSupabaseConfig && !user

    if (!user && !isV0Preview) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { incident } = body

    if (!incident) {
      return NextResponse.json({ error: "Incident data required" }, { status: 400 })
    }

    // Check if AI Gateway API key is available
    const hasAIKey = !!process.env.AI_GATEWAY_API_KEY

    if (!hasAIKey) {
      return NextResponse.json(
        {
          suggestions: "KI-Analyse ist nicht verfügbar. Bitte konfigurieren Sie einen AI Gateway API-Schlüssel.",
          error: "AI_GATEWAY_API_KEY not configured",
        },
        { status: 200 },
      )
    }

    // Generate AI suggestions using AI SDK
    try {
      const { generateText } = await import("ai")

      const prompt = `Du bist ein Experte für Patientensicherheit und Fehleranalyse im medizinischen Bereich. 

Analysiere folgenden Vorfall aus einem CIRS (Critical Incident Reporting System):

**Art des Vorfalls:** ${incident.incident_type === "error" ? "Fehler" : incident.incident_type === "near_error" ? "Beinahe-Fehler" : "Unerwünschtes Ereignis"}
**Schweregrad:** ${incident.severity}
**Kategorie:** ${incident.category}
**Titel:** ${incident.title}
**Beschreibung:** ${incident.description}
${incident.contributing_factors ? `**Beitragende Faktoren:** ${incident.contributing_factors}` : ""}
${incident.immediate_actions ? `**Sofortmaßnahmen:** ${incident.immediate_actions}` : ""}

Bitte erstelle eine strukturierte Analyse mit:

1. **Risikoanalyse:** Welche Risiken waren involviert?
2. **Ursachenanalyse:** Was waren die Hauptursachen?
3. **Präventionsempfehlungen:** Konkrete Maßnahmen zur Vermeidung ähnlicher Vorfälle
4. **Systemverbesserungen:** Welche Prozesse oder Systeme sollten angepasst werden?
5. **Schulungsbedarf:** Welche Schulungen könnten hilfreich sein?

Antworte auf Deutsch, professionell und praxisorientiert.`

      const result = await generateText({
        model: "openai/gpt-4o-mini",
        prompt,
        maxOutputTokens: 1000,
      })

      const suggestions = result.text

      // Update the incident with AI suggestions
      let queryClient = supabase
      if (isV0Preview) {
        queryClient = await createAdminClient()
      }

      await queryClient
        .from("cirs_incidents")
        .update({ ai_suggestions: suggestions })
        .eq("id", incidentId)
        .eq("practice_id", practiceId)

      return NextResponse.json({ suggestions })
    } catch (aiError) {
      console.error("Error generating AI suggestions:", aiError)
      return NextResponse.json(
        {
          suggestions:
            "Die KI-Analyse konnte nicht durchgeführt werden. Bitte versuchen Sie es später erneut oder wenden Sie sich an den Support.",
          error: aiError instanceof Error ? aiError.message : "AI generation failed",
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error("Error in AI suggestions POST:", error)
    return NextResponse.json(
      { error: "Failed to generate suggestions", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

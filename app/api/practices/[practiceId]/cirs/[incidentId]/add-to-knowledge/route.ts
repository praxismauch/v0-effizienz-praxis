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

    let queryClient = supabase
    if (isV0Preview) {
      queryClient = await createAdminClient()
    }

    // Get the incident with AI suggestions if available
    const { data: fullIncident, error: fetchError } = await queryClient
      .from("cirs_incidents")
      .select("*")
      .eq("id", incidentId)
      .eq("practice_id", practiceId)
      .single()

    if (fetchError || !fullIncident) {
      console.error("Error fetching incident:", fetchError)
      return NextResponse.json({ error: "Incident not found" }, { status: 404 })
    }

    // Create a knowledge base entry from the CIRS incident
    const getCategoryLabel = (cat: string) => {
      const categories: Record<string, string> = {
        medication: "Medikation",
        diagnosis: "Diagnose",
        treatment: "Behandlung",
        documentation: "Dokumentation",
        communication: "Kommunikation",
        hygiene: "Hygiene",
        equipment: "Geräte/Ausstattung",
        organization: "Organisation",
        other: "Sonstiges",
      }
      return categories[cat] || cat
    }

    const getTypeLabel = (type: string) => {
      const labels: Record<string, string> = {
        error: "Fehler",
        near_error: "Beinahe-Fehler",
        adverse_event: "Unerwünschtes Ereignis",
      }
      return labels[type] || type
    }

    // Build knowledge base content
    let content = `# CIRS-Vorfall: ${fullIncident.title}\n\n`
    content += `**Art:** ${getTypeLabel(fullIncident.incident_type)}\n`
    content += `**Kategorie:** ${getCategoryLabel(fullIncident.category)}\n`
    content += `**Schweregrad:** ${fullIncident.severity}\n\n`
    content += `## Beschreibung\n\n${fullIncident.description}\n\n`

    if (fullIncident.contributing_factors) {
      content += `## Beitragende Faktoren\n\n${fullIncident.contributing_factors}\n\n`
    }

    if (fullIncident.immediate_actions) {
      content += `## Sofortmaßnahmen\n\n${fullIncident.immediate_actions}\n\n`
    }

    if (fullIncident.ai_suggestions) {
      content += `## KI-Analyse und Empfehlungen\n\n${fullIncident.ai_suggestions}\n\n`
    }

    // Add to knowledge base
    const knowledgeData = {
      practice_id: practiceId,
      category: "cirs",
      type: "analysis",
      title: `CIRS: ${fullIncident.title}`,
      content,
      tags: [
        "CIRS",
        getCategoryLabel(fullIncident.category),
        getTypeLabel(fullIncident.incident_type),
        fullIncident.severity,
      ],
      source: "cirs_incident",
      source_id: incidentId,
      created_by: user?.id || null,
    }

    const { data: knowledgeEntry, error: knowledgeError } = await queryClient
      .from("knowledge_base")
      .insert([knowledgeData])
      .select()
      .single()

    if (knowledgeError) {
      console.error("Error creating knowledge entry:", knowledgeError)
      return NextResponse.json({ error: knowledgeError.message }, { status: 500 })
    }

    // Update incident to mark it as added to knowledge base
    await queryClient
      .from("cirs_incidents")
      .update({ added_to_knowledge: true, knowledge_entry_id: knowledgeEntry.id })
      .eq("id", incidentId)

    return NextResponse.json({ success: true, knowledgeEntry })
  } catch (error) {
    console.error("Error in add-to-knowledge POST:", error)
    return NextResponse.json(
      { error: "Failed to add to knowledge base", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

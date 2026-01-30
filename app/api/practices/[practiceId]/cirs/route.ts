import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const hasSupabaseConfig = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    const isV0Preview = hasSupabaseConfig && !user

    if (!user && !isV0Preview) {
      return NextResponse.json({ incidents: [], error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let queryClient = supabase
    if (isV0Preview) {
      queryClient = await createAdminClient()
    }

    let query = queryClient
      .from("cirs_incidents")
      .select(
        `
        *,
        reporter:reported_by(name, role),
        comments:cirs_incident_comments(count)
      `,
      )
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching CIRS incidents:", error)
      return NextResponse.json({ incidents: [], error: error.message }, { status: 500 })
    }

    const incidents = (data || []).map((incident: any) => ({
      ...incident,
      reporter_name: incident.is_anonymous ? null : incident.reporter?.name,
      reporter_role: incident.is_anonymous ? null : incident.reporter?.role,
      comment_count: incident.comments?.[0]?.count || 0,
    }))

    return NextResponse.json({ incidents })
  } catch (error) {
    console.error("Error in CIRS GET:", error)
    return NextResponse.json(
      { incidents: [], error: "Failed to fetch incidents", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
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
    const {
      incident_type,
      severity,
      category,
      title,
      description,
      contributing_factors,
      immediate_actions,
      is_anonymous,
      generate_ai_suggestions,
      add_to_knowledge,
    } = body

    if (!incident_type || !severity || !category || !title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let queryClient = supabase
    if (isV0Preview) {
      queryClient = await createAdminClient()
    }

    const incidentData: any = {
      practice_id: practiceId,
      incident_type,
      severity,
      category,
      title,
      description,
      contributing_factors,
      immediate_actions,
      is_anonymous,
      status: "submitted",
    }

    if (!is_anonymous && user) {
      incidentData.reported_by = user.id
    }

    const { data: incident, error } = await queryClient.from("cirs_incidents").insert([incidentData]).select().single()

    if (error) {
      console.error("Error creating CIRS incident:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate AI suggestions if requested
    if (generate_ai_suggestions && incident) {
      try {
        const aiResponse = await fetch(`${request.url}/${incident.id}/ai-suggestions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ incident }),
        })

        if (aiResponse.ok) {
          const { suggestions } = await aiResponse.json()
          await queryClient.from("cirs_incidents").update({ ai_suggestions: suggestions }).eq("id", incident.id)
        }
      } catch (error) {
        console.error("Error generating AI suggestions:", error)
      }
    }

    // Add to knowledge base if requested
    if (add_to_knowledge && incident) {
      try {
        const knowledgeResponse = await fetch(`${request.url}/${incident.id}/add-to-knowledge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ incident }),
        })

        if (!knowledgeResponse.ok) {
          console.error("Failed to add to knowledge base")
        }
      } catch (error) {
        console.error("Error adding to knowledge base:", error)
      }
    }

    return NextResponse.json({ incident }, { status: 201 })
  } catch (error) {
    console.error("Error in CIRS POST:", error)
    return NextResponse.json(
      { error: "Failed to create incident", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

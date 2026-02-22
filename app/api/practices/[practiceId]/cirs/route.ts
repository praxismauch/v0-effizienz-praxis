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
      .select("*")
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

    // Resolve reporter names from profiles if reported_by contains user IDs
    const reporterIds = (data || [])
      .filter((i: any) => i.reported_by && !i.is_anonymous)
      .map((i: any) => i.reported_by)
      .filter((id: string, idx: number, arr: string[]) => arr.indexOf(id) === idx)

    let profileMap: Record<string, { name: string; role: string }> = {}
    if (reporterIds.length > 0) {
      const { data: profiles } = await queryClient
        .from("profiles")
        .select("id, first_name, last_name, role")
        .in("id", reporterIds)

      if (profiles) {
        for (const p of profiles) {
          profileMap[p.id] = {
            name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unbekannt",
            role: p.role || "",
          }
        }
      }
    }

    const incidents = (data || []).map((incident: any) => {
      const reporter = profileMap[incident.reported_by]
      return {
        ...incident,
        reporter_name: incident.is_anonymous ? null : (reporter?.name || null),
        reporter_role: incident.is_anonymous ? null : (reporter?.role || null),
        comment_count: 0,
      }
    })

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
      status: "open",
    }

    if (!is_anonymous && user) {
      incidentData.reported_by = user.id
    }

    // Use insert without .single() to avoid "Cannot coerce" errors when RLS blocks the select
    const { data: insertedRows, error } = await queryClient.from("cirs_incidents").insert([incidentData]).select()

    if (error) {
      console.error("Error creating CIRS incident:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const incident = insertedRows?.[0] || null

    // Build a safe base URL for internal API calls (avoid SSL issues with self-fetch)
    const origin = request.headers.get("origin") 
      || request.headers.get("x-forwarded-host") && `${request.headers.get("x-forwarded-proto") || "http"}://${request.headers.get("x-forwarded-host")}`
      || process.env.NEXT_PUBLIC_APP_URL 
      || "http://localhost:3000"
    const baseApiUrl = `${origin}/api/practices/${practiceId}/cirs`

    // Generate AI suggestions if requested
    if (generate_ai_suggestions && incident) {
      try {
        const aiResponse = await fetch(`${baseApiUrl}/${incident.id}/ai-suggestions`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(request.headers.get("cookie") ? { cookie: request.headers.get("cookie")! } : {}),
          },
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
        const knowledgeResponse = await fetch(`${baseApiUrl}/${incident.id}/add-to-knowledge`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(request.headers.get("cookie") ? { cookie: request.headers.get("cookie")! } : {}),
          },
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

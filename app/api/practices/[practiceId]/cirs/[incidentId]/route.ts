import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
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

    let queryClient = supabase
    if (isV0Preview) {
      queryClient = await createAdminClient()
    }

    const { data: incident, error } = await queryClient
      .from("cirs_incidents")
      .select(
        `
        *,
        reporter:reported_by(name, role),
        comments:cirs_incident_comments(*)
      `,
      )
      .eq("id", incidentId)
      .eq("practice_id", practiceId)
      .single()

    if (error) {
      console.error("Error fetching incident:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 })
    }

    const result = {
      ...incident,
      reporter_name: incident.is_anonymous ? null : incident.reporter?.name,
      reporter_role: incident.is_anonymous ? null : incident.reporter?.role,
    }

    return NextResponse.json({ incident: result })
  } catch (error) {
    console.error("Error in incident GET:", error)
    return NextResponse.json(
      { error: "Failed to fetch incident", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function PATCH(
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
    const { status, ai_suggestions } = body

    let queryClient = supabase
    if (isV0Preview) {
      queryClient = await createAdminClient()
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (ai_suggestions) updateData.ai_suggestions = ai_suggestions

    const { data: incident, error } = await queryClient
      .from("cirs_incidents")
      .update(updateData)
      .eq("id", incidentId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("Error updating incident:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ incident })
  } catch (error) {
    console.error("Error in incident PATCH:", error)
    return NextResponse.json(
      { error: "Failed to update incident", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function DELETE(
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

    let queryClient = supabase
    if (isV0Preview) {
      queryClient = await createAdminClient()
    }

    const { error } = await queryClient.from("cirs_incidents").delete().eq("id", incidentId).eq("practice_id", practiceId)

    if (error) {
      console.error("Error deleting incident:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in incident DELETE:", error)
    return NextResponse.json(
      { error: "Failed to delete incident", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

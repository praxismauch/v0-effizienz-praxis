import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

// GET all homeoffice policies for a practice
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId || practiceId === "undefined") {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: policies, error } = await supabase
      .from("homeoffice_policies")
      .select(`
        id,
        practice_id,
        user_id,
        is_allowed,
        allowed_days,
        allowed_start_time,
        allowed_end_time,
        max_days_per_week,
        requires_reason,
        requires_location_verification,
        created_at,
        updated_at
      `)
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching homeoffice policies:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get team member names for policies with user_id
    const userIds = policies?.filter((p) => p.user_id).map((p) => p.user_id) || []
    let teamMembers: any[] = []

    if (userIds.length > 0) {
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id, first_name, last_name")
        .eq("practice_id", practiceId)
        .in("user_id", userIds)

      teamMembers = members || []
    }

    // Enrich policies with team member names
    const enrichedPolicies = policies?.map((policy) => {
      if (policy.user_id) {
        const member = teamMembers.find((m) => m.user_id === policy.user_id)
        return {
          ...policy,
          user_name: member ? `${member.first_name} ${member.last_name}` : "Unbekannt",
        }
      }
      return {
        ...policy,
        user_name: "Alle Mitarbeiter",
      }
    })

    return NextResponse.json(enrichedPolicies || [])
  } catch (error) {
    console.error("[v0] Exception in GET homeoffice policies:", error)
    return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 })
  }
}

// POST create new homeoffice policy
export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    if (!practiceId || practiceId === "undefined") {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    // Validate required fields
    if (typeof body.is_allowed !== "boolean") {
      return NextResponse.json({ error: "is_allowed is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Check if policy already exists for this user (or default)
    const { data: existing } = await supabase
      .from("homeoffice_policies")
      .select("id")
      .eq("practice_id", practiceId)
      .eq("user_id", body.user_id || null)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Policy bereits vorhanden für diesen Mitarbeiter" }, { status: 409 })
    }

    const policyId = uuidv4()
    const now = new Date().toISOString()

    const { data: policy, error } = await supabase
      .from("homeoffice_policies")
      .insert({
        id: policyId,
        practice_id: practiceId,
        user_id: body.user_id || null,
        is_allowed: body.is_allowed,
        allowed_days: body.allowed_days || [],
        allowed_start_time: body.allowed_start_time || null,
        allowed_end_time: body.allowed_end_time || null,
        max_days_per_week: body.max_days_per_week || 2,
        requires_reason: body.requires_reason ?? true,
        requires_location_verification: body.requires_location_verification ?? false,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating homeoffice policy:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(policy)
  } catch (error) {
    console.error("[v0] Exception in POST homeoffice policy:", error)
    return NextResponse.json({ error: "Failed to create policy" }, { status: 500 })
  }
}

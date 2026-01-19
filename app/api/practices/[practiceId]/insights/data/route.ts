import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET - Fetch all data needed for journal generation
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const periodStart = searchParams.get("period_start")
    const periodEnd = searchParams.get("period_end")

    // Fetch all data in parallel
    const [kpisResult, teamResult, goalsResult, workflowsResult, valuesResult] = await Promise.all([
      adminClient
        .from("analytics_parameters")
        .select("*")
        .eq("practice_id", practiceId)
        .is("deleted_at", null),
      adminClient
        .from("team_members")
        .select("*")
        .eq("practice_id", practiceId),
      adminClient
        .from("goals")
        .select("*")
        .eq("practice_id", practiceId)
        .is("deleted_at", null),
      adminClient
        .from("workflows")
        .select("*")
        .eq("practice_id", practiceId)
        .is("deleted_at", null),
      periodStart && periodEnd
        ? adminClient
            .from("parameter_values")
            .select("*")
            .eq("practice_id", practiceId)
            .gte("recorded_date", periodStart)
            .lte("recorded_date", periodEnd)
            .is("deleted_at", null)
        : Promise.resolve({ data: [] }),
    ])

    return NextResponse.json({
      kpis: kpisResult.data || [],
      teamMembers: teamResult.data || [],
      goals: goalsResult.data || [],
      workflows: workflowsResult.data || [],
      parameterValues: valuesResult.data || [],
    })
  } catch (error: any) {
    console.error("[v0] Error fetching insights data:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: error.message || "Failed to fetch insights data" }, { status: 500 })
  }
}

// POST - Save self-check data
export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await adminClient
      .from("user_self_checks")
      .insert({
        user_id: user.id,
        practice_id: practiceId,
        assessment_date: body.assessment_date,
        energy_level: body.energy_level,
        mental_clarity: body.mental_clarity,
        emotional_balance: body.emotional_balance,
        social_connection: body.social_connection,
        work_life_balance: body.work_life_balance,
        overall_satisfaction: body.overall_satisfaction,
        overall_score: body.overall_score,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ selfCheck: data })
  } catch (error: any) {
    console.error("[v0] Error saving self-check:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: error.message || "Failed to save self-check" }, { status: 500 })
  }
}

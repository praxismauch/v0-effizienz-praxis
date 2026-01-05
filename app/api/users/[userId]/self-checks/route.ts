import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const supabase = createAdminClient()

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "52") // Default to 1 year of weekly checks

    const { data, error } = await supabase
      .from("user_self_checks")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("assessment_date", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching self-checks:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in self-checks GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const body = await request.json()
    const supabase = createAdminClient()

    // Calculate overall score
    const dimensions = [
      body.energy_level,
      body.stress_level ? 11 - body.stress_level : null, // Invert stress (high stress = low score)
      body.work_satisfaction,
      body.team_harmony,
      body.work_life_balance,
      body.motivation,
      body.overall_wellbeing,
    ].filter((v) => v !== null && v !== undefined) as number[]

    const overall_score = dimensions.length > 0 ? dimensions.reduce((a, b) => a + b, 0) / dimensions.length : null

    const { data, error } = await supabase
      .from("user_self_checks")
      .upsert(
        {
          user_id: userId,
          practice_id: body.practice_id,
          assessment_date: body.assessment_date || new Date().toISOString().split("T")[0],
          energy_level: body.energy_level,
          stress_level: body.stress_level,
          work_satisfaction: body.work_satisfaction,
          team_harmony: body.team_harmony,
          work_life_balance: body.work_life_balance,
          motivation: body.motivation,
          overall_wellbeing: body.overall_wellbeing,
          overall_score,
          notes: body.notes,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,assessment_date",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("Error saving self-check:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in self-checks POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

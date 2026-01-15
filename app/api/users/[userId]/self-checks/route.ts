import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const supabase = await createAdminClient()

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "52")

    console.log("[v0] GET self-checks for userId:", userId)

    const { data, error } = await supabase
      .from("user_self_checks")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("assessment_date", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[v0] Error fetching self-checks:", error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    console.log("[v0] Fetched self-checks count:", data?.length || 0)
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error in self-checks GET:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const body = await request.json()
    const supabase = await createAdminClient()

    console.log("[v0] POST self-check for userId:", userId)
    console.log("[v0] Request body:", JSON.stringify(body, null, 2))

    // Calculate overall score
    const dimensions = [
      body.energy_level,
      body.stress_level ? 11 - body.stress_level : null,
      body.work_satisfaction,
      body.team_harmony,
      body.work_life_balance,
      body.motivation,
      body.overall_wellbeing,
    ].filter((v) => v !== null && v !== undefined) as number[]

    const overall_score = dimensions.length > 0 ? dimensions.reduce((a, b) => a + b, 0) / dimensions.length : null

    const assessmentDate = body.assessment_date || new Date().toISOString().split("T")[0]

    const { data: existing } = await supabase
      .from("user_self_checks")
      .select("id")
      .eq("user_id", userId)
      .eq("assessment_date", assessmentDate)
      .maybeSingle()

    console.log("[v0] Existing record:", existing)

    const practiceIdInt = body.practice_id ? Number.parseInt(String(body.practice_id), 10) : null

    const recordData = {
      user_id: userId,
      practice_id: practiceIdInt,
      assessment_date: assessmentDate,
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
    }

    let data, error

    if (existing?.id) {
      console.log("[v0] Updating existing record:", existing.id)
      const result = await supabase.from("user_self_checks").update(recordData).eq("id", existing.id).select().single()
      data = result.data
      error = result.error
    } else {
      console.log("[v0] Inserting new record")
      const result = await supabase.from("user_self_checks").insert(recordData).select().single()
      data = result.data
      error = result.error
    }

    if (error) {
      console.error("[v0] Error saving self-check:", error)
      console.error("[v0] Error code:", error.code)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error details:", error.details)
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Successfully saved self-check:", data?.id)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in self-checks POST:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}

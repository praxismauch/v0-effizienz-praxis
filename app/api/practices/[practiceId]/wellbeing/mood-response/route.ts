import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  const { practiceId } = await params
  const supabase = await createClient()
  const body = await request.json()

  try {
    // Create a hash for duplicate prevention (date + random to allow one per day per browser)
    const today = new Date().toISOString().split("T")[0]
    const randomPart = crypto.randomBytes(16).toString("hex")
    const submissionHash = crypto.createHash("sha256").update(`${today}-${randomPart}`).digest("hex")

    const { data, error } = await supabase
      .from("anonymous_mood_responses")
      .insert({
        practice_id: Number.parseInt(practiceId),
        survey_id: body.survey_id || null,
        energy_level: body.energy_level,
        stress_level: body.stress_level,
        work_satisfaction: body.work_satisfaction,
        team_harmony: body.team_harmony,
        work_life_balance: body.work_life_balance,
        leadership_support: body.leadership_support,
        growth_opportunities: body.growth_opportunities,
        workload_fairness: body.workload_fairness,
        positive_feedback: body.positive_feedback || null,
        improvement_suggestions: body.improvement_suggestions || null,
        concerns: body.concerns || null,
        submission_hash: submissionHash,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error submitting mood response:", error)
    return NextResponse.json({ error: "Failed to submit response" }, { status: 500 })
  }
}

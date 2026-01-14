import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const HARDCODED_PRACTICE_ID = "1"

// GET - Fetch onboarding progress for current user
export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    const effectivePracticeId =
      practiceId && practiceId !== "undefined" && practiceId !== "0" ? practiceId : HARDCODED_PRACTICE_ID

    const { data, error } = await supabaseAdmin
      .from("onboarding_progress")
      .select("*")
      .eq("practice_id", Number.parseInt(effectivePracticeId))
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) {
      console.error("Error fetching onboarding progress:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ progress: data || null })
  } catch (error) {
    console.error("Error in GET onboarding-progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create or update onboarding progress
export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      currentStep,
      steps,
      isCompleted,
      teamSize,
      practiceGoals,
      practiceType,
      painPoints,
      skippedSteps,
      timeSpentSeconds,
      interactionsCount,
    } = body

    const supabaseAdmin = createAdminClient()

    const effectivePracticeId =
      practiceId && practiceId !== "undefined" && practiceId !== "0" ? practiceId : HARDCODED_PRACTICE_ID

    // Prepare upsert data
    const upsertData: Record<string, unknown> = {
      practice_id: Number.parseInt(effectivePracticeId),
      user_id: user.id,
      last_step_at: new Date().toISOString(),
    }

    if (currentStep !== undefined) upsertData.current_step = currentStep
    if (steps !== undefined) upsertData.steps = steps
    if (isCompleted !== undefined) {
      upsertData.is_completed = isCompleted
      if (isCompleted) {
        upsertData.completed_at = new Date().toISOString()
      }
    }
    if (teamSize !== undefined) upsertData.team_size = teamSize
    if (practiceGoals !== undefined) upsertData.practice_goals = practiceGoals
    if (practiceType !== undefined) upsertData.practice_type = practiceType
    if (painPoints !== undefined) upsertData.pain_points = painPoints
    if (skippedSteps !== undefined) upsertData.skipped_steps = skippedSteps
    if (timeSpentSeconds !== undefined) upsertData.time_spent_seconds = timeSpentSeconds
    if (interactionsCount !== undefined) upsertData.interactions_count = interactionsCount

    const { data, error } = await supabaseAdmin
      .from("onboarding_progress")
      .upsert(upsertData, {
        onConflict: "practice_id,user_id",
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving onboarding progress:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ progress: data })
  } catch (error) {
    console.error("Error in POST onboarding-progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ practiceId: string; planId: string }> },
) {
  const { practiceId, planId } = await context.params
  const supabase = await createClient()

  try {
    const body = await request.json()
    const { notes } = body

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify plan belongs to practice
    const { data: plan, error: planError } = await supabase
      .from("hygiene_plans")
      .select("id")
      .eq("id", planId)
      .eq("practice_id", practiceId)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Create execution record
    const { data: execution, error } = await supabase
      .from("hygiene_plan_executions")
      .insert({
        plan_id: planId,
        executed_by: user.id,
        executed_at: new Date().toISOString(),
        notes,
        verification_status: "completed",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ execution }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating execution:", error)
    return NextResponse.json(
      { error: "Failed to create execution", details: error.message },
      { status: 500 },
    )
  }
}

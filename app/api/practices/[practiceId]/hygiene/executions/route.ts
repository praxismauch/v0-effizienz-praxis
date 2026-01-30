import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ practiceId: string }> },
) {
  const { practiceId } = await context.params
  const supabase = await createClient()

  try {
    const { data: executions, error } = await supabase
      .from("hygiene_plan_executions")
      .select(`
        *,
        hygiene_plans!inner(practice_id)
      `)
      .eq("hygiene_plans.practice_id", practiceId)
      .order("executed_at", { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ executions })
  } catch (error: any) {
    console.error("Error fetching hygiene executions:", error)
    return NextResponse.json(
      { error: "Failed to fetch executions", details: error.message },
      { status: 500 },
    )
  }
}

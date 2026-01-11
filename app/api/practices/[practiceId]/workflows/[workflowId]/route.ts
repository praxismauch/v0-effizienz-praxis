import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const HARDCODED_PRACTICE_ID = "1"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; workflowId: string }> },
) {
  const supabase = await createAdminClient()

  try {
    const { practiceId: rawPracticeId, workflowId } = await params
    const practiceId = rawPracticeId || HARDCODED_PRACTICE_ID

    const body = await request.json()

    const { data: workflow, error } = await supabase
      .from("workflows")
      .update({
        name: body.title,
        description: body.description,
        status: body.status,
        category: body.category,
        progress_percentage: body.progress_percentage,
        completed_steps: body.completed_steps,
        completed_at: body.completedAt,
      })
      .eq("id", String(workflowId))
      .eq("practice_id", String(practiceId))
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] Workflow PATCH - Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!workflow) {
      return NextResponse.json({ error: "Workflow nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error("[v0] Workflow PATCH - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; workflowId: string }> },
) {
  const supabase = await createAdminClient()

  try {
    const { practiceId: rawPracticeId, workflowId } = await params
    const practiceId = rawPracticeId || HARDCODED_PRACTICE_ID

    await supabase
      .from("workflow_steps")
      .update({ deleted_at: new Date().toISOString() })
      .eq("workflow_id", String(workflowId))

    const { error } = await supabase
      .from("workflows")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", String(workflowId))
      .eq("practice_id", String(practiceId))

    if (error) {
      console.error("[v0] Workflow DELETE - Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Workflow DELETE - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

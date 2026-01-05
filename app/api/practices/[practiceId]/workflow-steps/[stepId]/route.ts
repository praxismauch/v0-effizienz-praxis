import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ practiceId: string; stepId: string }> },
) {
  try {
    const { practiceId, stepId } = await context.params
    const supabase = await createAdminClient()
    const updates = await request.json()

    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt
    if (updates.completedBy !== undefined) dbUpdates.completed_by = updates.completedBy
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    // Removed assigned_to, due_date and other fields that don't exist yet

    // Update the workflow step
    const { data: step, error } = await supabase
      .from("workflow_steps")
      .update(dbUpdates)
      .eq("id", stepId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(step)
  } catch (error) {
    console.error("[v0] Error updating workflow step:", error)
    return NextResponse.json({ error: "Failed to update workflow step" }, { status: 500 })
  }
}

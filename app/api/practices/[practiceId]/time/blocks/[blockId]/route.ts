import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; blockId: string }> }
) {
  try {
    const { practiceId, blockId } = await params
    if (!practiceId || !blockId) {
      return NextResponse.json({ error: "Practice ID and Block ID required" }, { status: 400 })
    }

    const { adminClient: supabase } = await requirePracticeAccess(practiceId)
    const body = await request.json()

    // Only allow safe fields to be updated
    const allowedFields = [
      "start_time", "end_time", "is_open", "status", "notes",
      "location_type", "break_minutes", "actual_hours", "overtime_minutes",
      "planned_hours", "updated_at",
    ]
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field]
    }

    const { data: block, error } = await supabase
      .from("time_blocks")
      .update(updateData)
      .eq("id", blockId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[API] Error updating time block:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ block })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; blockId: string }> }
) {
  try {
    const { practiceId, blockId } = await params
    if (!practiceId || !blockId) {
      return NextResponse.json({ error: "Practice ID and Block ID required" }, { status: 400 })
    }

    const { adminClient: supabase } = await requirePracticeAccess(practiceId)

    const { error } = await supabase
      .from("time_blocks")
      .delete()
      .eq("id", blockId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[API] Error deleting time block:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

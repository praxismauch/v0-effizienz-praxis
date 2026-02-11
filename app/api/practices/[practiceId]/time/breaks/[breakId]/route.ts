import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; breakId: string }> }
) {
  try {
    const { practiceId, breakId } = await params
    if (!practiceId || !breakId) {
      return NextResponse.json({ error: "Practice ID and Break ID required" }, { status: 400 })
    }

    const { adminClient: supabase } = await requirePracticeAccess(practiceId)
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.end_time !== undefined) updateData.end_time = body.end_time
    if (body.duration_minutes !== undefined) updateData.duration_minutes = body.duration_minutes
    if (body.break_type !== undefined) updateData.break_type = body.break_type

    const { data: breakRecord, error } = await supabase
      .from("time_block_breaks")
      .update(updateData)
      .eq("id", breakId)
      .select()
      .single()

    if (error) {
      console.error("[API] Error updating break:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If break was ended, update the parent block's break_minutes
    if (body.end_time && breakRecord.time_block_id) {
      const { data: allBreaks } = await supabase
        .from("time_block_breaks")
        .select("start_time, end_time")
        .eq("time_block_id", breakRecord.time_block_id)
        .not("end_time", "is", null)

      if (allBreaks) {
        const totalBreakMins = allBreaks.reduce((sum, b) => {
          const mins = (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 60000
          return sum + Math.round(mins)
        }, 0)

        await supabase
          .from("time_blocks")
          .update({ break_minutes: totalBreakMins, updated_at: new Date().toISOString() })
          .eq("id", breakRecord.time_block_id)
      }
    }

    return NextResponse.json({ success: true, break: breakRecord })
  } catch (error) {
    return handleApiError(error)
  }
}

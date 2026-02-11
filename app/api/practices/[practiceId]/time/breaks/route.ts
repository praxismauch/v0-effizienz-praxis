import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    const { adminClient: supabase } = await requirePracticeAccess(practiceId)
    const body = await request.json()
    const { blockId, startTime, endTime } = body

    if (!blockId || !startTime) {
      return NextResponse.json({ error: "blockId and startTime are required" }, { status: 400 })
    }

    const { data: breakRecord, error } = await supabase
      .from("time_block_breaks")
      .insert({
        time_block_id: blockId,
        start_time: startTime,
        end_time: endTime || null,
        break_type: "regular",
      })
      .select()
      .single()

    if (error) {
      console.error("[API] Error creating break:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, break: breakRecord })
  } catch (error) {
    return handleApiError(error)
  }
}

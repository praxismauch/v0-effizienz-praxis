import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { format } from "date-fns"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const today = format(new Date(), "yyyy-MM-dd")

    // Get today's open time block
    const { data: block, error: blockError } = await supabase
      .from("time_blocks")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("user_id", userId)
      .eq("date", today)
      .eq("is_open", true)
      .maybeSingle()

    if (blockError) {
      console.error("[v0] Error fetching time block:", blockError)
    }

    if (!block) {
      return NextResponse.json({
        status: "idle",
        block: null,
        isOnBreak: false,
        activeBreak: null,
      })
    }

    // Check if on break
    const { data: activeBreak, error: breakError } = await supabase
      .from("time_block_breaks")
      .select("*")
      .eq("time_block_id", block.id)
      .is("end_time", null)
      .maybeSingle()

    if (breakError) {
      console.error("[v0] Error fetching breaks:", breakError)
    }

    // Map block to expected format for client
    const mappedBlock = {
      id: block.id,
      user_id: block.user_id,
      practice_id: block.practice_id,
      date: block.date,
      start_time: block.start_time,
      end_time: block.end_time,
      break_minutes: block.break_minutes || 0,
      location_type: block.work_location, // Map work_location to location_type for client
      status: block.is_open ? "active" : "completed",
      actual_hours: block.net_minutes ? block.net_minutes / 60 : 0,
    }

    return NextResponse.json({
      status: activeBreak ? "break" : "working",
      block: mappedBlock,
      isOnBreak: !!activeBreak,
      activeBreak: activeBreak,
    })
  } catch (error) {
    console.error("[v0] Error fetching current status:", error)
    return NextResponse.json(
      { error: "Failed to fetch current status" },
      { status: 500 }
    )
  }
}

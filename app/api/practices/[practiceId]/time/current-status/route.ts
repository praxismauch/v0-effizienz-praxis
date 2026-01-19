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
    const { data: blocks } = await supabase
      .from("time_blocks")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("user_id", userId)
      .eq("date", today)
      .eq("is_open", true)
      .maybeSingle()

    if (!blocks) {
      return NextResponse.json({
        status: "idle",
        currentBlock: null,
        isOnBreak: false,
      })
    }

    // Check if on break
    const { data: breaks } = await supabase
      .from("time_block_breaks")
      .select("*")
      .eq("time_block_id", blocks.id)
      .is("end_time", null)
      .maybeSingle()

    return NextResponse.json({
      status: breaks ? "break" : "working",
      currentBlock: blocks,
      isOnBreak: !!breaks,
      currentBreak: breaks,
    })
  } catch (error) {
    console.error("[v0] Error fetching current status:", error)
    return NextResponse.json(
      { error: "Failed to fetch current status" },
      { status: 500 }
    )
  }
}

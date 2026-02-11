import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    const { adminClient: supabase } = await requirePracticeAccess(practiceId)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Find open time block for this user
    const { data: block, error: blockError } = await supabase
      .from("time_blocks")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("user_id", userId)
      .eq("is_open", true)
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (blockError) {
      console.error("[API] Error fetching time block:", blockError)
      return NextResponse.json({ error: blockError.message }, { status: 500 })
    }

    if (!block) {
      return NextResponse.json({ status: "idle", block: null, activeBreak: null })
    }

    // Check if there's an active break
    const { data: activeBreak } = await supabase
      .from("time_block_breaks")
      .select("*")
      .eq("time_block_id", block.id)
      .is("end_time", null)
      .maybeSingle()

    return NextResponse.json({
      status: activeBreak ? "break" : "working",
      block,
      activeBreak: activeBreak || null,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

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
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    let query = supabase
      .from("time_blocks")
      .select("*, time_block_breaks(*)")
      .eq("user_id", userId)
      .eq("practice_id", practiceId)
      .order("start_time", { ascending: false })

    if (startDate) {
      query = query.gte("date", startDate)
    }
    if (endDate) {
      query = query.lte("date", endDate)
    }

    const { data: blocks, error } = await query

    if (error) {
      console.error("[API] Error fetching time blocks:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ blocks: blocks || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

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
    const { userId, startTime, endTime, location, comment } = body

    if (!userId || !startTime) {
      return NextResponse.json({ error: "userId and startTime are required" }, { status: 400 })
    }

    const date = new Date(startTime).toISOString().split("T")[0]

    const { data: block, error } = await supabase
      .from("time_blocks")
      .insert({
        user_id: userId,
        practice_id: practiceId,
        date,
        start_time: startTime,
        end_time: endTime || null,
        work_location: location || "office",
        is_open: !endTime,
        break_minutes: 0,
        notes: comment || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[API] Error creating time block:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ block })
  } catch (error) {
    return handleApiError(error)
  }
}

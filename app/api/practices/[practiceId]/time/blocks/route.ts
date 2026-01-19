import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    let query = supabase
      .from("time_blocks")
      .select("*, time_block_breaks(*)")
      .eq("user_id", userId)
      .eq("practice_id", practiceId)
      .order("start_time", { ascending: false })

    if (startDate) {
      query = query.gte("start_time", startDate)
    }
    if (endDate) {
      query = query.lte("start_time", endDate)
    }

    const { data: blocks, error } = await query

    if (error) {
      console.error("[v0] Error fetching time blocks:", error)
      return NextResponse.json(
        { error: "Failed to fetch time blocks", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ blocks: blocks || [] })
  } catch (error) {
    console.error("[v0] Error in time blocks API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()
    
    const body = await request.json()
    const { userId, startTime, endTime, type, location, comment } = body

    if (!userId || !startTime) {
      return NextResponse.json(
        { error: "userId and startTime are required" },
        { status: 400 }
      )
    }

    // Insert time block
    const { data: block, error: blockError } = await supabase
      .from("time_blocks")
      .insert({
        user_id: userId,
        practice_id: practiceId,
        start_time: startTime,
        end_time: endTime,
        type: type || "regular",
        location,
        comment,
      })
      .select()
      .maybeSingle()

    if (blockError) {
      console.error("[v0] Error creating time block:", blockError)
      return NextResponse.json(
        { error: "Failed to create time block", details: blockError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ block })
  } catch (error) {
    console.error("[v0] Error in time blocks API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

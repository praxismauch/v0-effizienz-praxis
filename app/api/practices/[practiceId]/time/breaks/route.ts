import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId: practiceIdStr } = await params
    const practiceId = parseInt(practiceIdStr, 10)
    
    if (isNaN(practiceId)) {
      return NextResponse.json(
        { error: "Invalid practice ID" },
        { status: 400 }
      )
    }
    
    const supabase = await createAdminClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Datenbankverbindung nicht verfügbar", success: false },
        { status: 503 }
      )
    }
    
    const body = await request.json()
    const { blockId, userId, startTime, endTime } = body

    if (!blockId || !startTime) {
      return NextResponse.json(
        { error: "blockId and startTime are required" },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    // Insert break
    const { data: breakRecord, error } = await supabase
      .from("time_block_breaks")
      .insert({
        block_id: blockId,
        user_id: userId,
        practice_id: practiceId,
        start_time: startTime,
        end_time: endTime,
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] Error creating break:", error)
      return NextResponse.json(
        { error: "Failed to create break", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ break: breakRecord })
  } catch (error) {
    console.error("[v0] Error in breaks API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

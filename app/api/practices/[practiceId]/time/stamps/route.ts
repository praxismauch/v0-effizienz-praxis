import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { format } from "date-fns"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId: practiceIdStr } = await params
    const practiceId = parseInt(practiceIdStr, 10)
    console.log("[v0] Stamps API called with practiceId:", practiceId)
    
    if (isNaN(practiceId)) {
      return NextResponse.json(
        { error: "Invalid practice ID" },
        { status: 400 }
      )
    }
    
    const supabase = await createAdminClient()
    console.log("[v0] Admin client created successfully")
    
    const body = await request.json()
    const { user_id, action, location, comment } = body
    console.log("[v0] Request body:", { user_id, action, location, hasComment: !!comment })

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      )
    }

    if (!action || !["clock_in", "clock_out"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'clock_in' or 'clock_out'" },
        { status: 400 }
      )
    }

    const now = new Date()
    const today = format(now, "yyyy-MM-dd")
    console.log("[v0] Timestamp:", now.toISOString(), "Date:", today)

    if (action === "clock_in") {
      console.log("[v0] Processing clock_in action")
      
      // Check if there's already an open block for today
      console.log("[v0] Checking for existing open block with:", { practice_id: practiceId, user_id, date: today })
      const { data: existingBlock, error: checkError } = await supabase
        .from("time_blocks")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("user_id", user_id)
        .eq("date", today)
        .eq("is_open", true)
        .maybeSingle()

      if (checkError) {
        console.error("[v0] Error checking for existing block:", checkError)
      }
      console.log("[v0] Existing block check result:", { found: !!existingBlock })

      if (existingBlock) {
        return NextResponse.json(
          { error: "Already clocked in. Please clock out first.", success: false },
          { status: 400 }
        )
      }

      // Create a start stamp
      console.log("[v0] Creating start stamp with:", { user_id, practice_id: practiceId, stamp_type: "start", work_location: location || "office" })
      const { data: stamp, error: stampError } = await supabase
        .from("time_stamps")
        .insert({
          user_id,
          practice_id: practiceId,
          stamp_type: "start",
          work_location: location || "office",
          timestamp: now.toISOString(),
          comment,
        })
        .select()
        .single()

      if (stampError) {
        console.error("[v0] Error creating start stamp:", stampError)
        console.error("[v0] Stamp error details:", JSON.stringify(stampError, null, 2))
        return NextResponse.json(
          { error: "Failed to create time stamp", details: stampError.message, success: false },
          { status: 500 }
        )
      }
      console.log("[v0] Stamp created successfully:", stamp)

      // Create a new time block
      const { data: block, error: blockError } = await supabase
        .from("time_blocks")
        .insert({
          user_id,
          practice_id: practiceId,
          date: today,
          start_time: now.toISOString(),
          start_stamp_id: stamp.id,
          work_location: location || "office",
          is_open: true,
          break_minutes: 0,
          gross_minutes: 0,
          net_minutes: 0,
        })
        .select()
        .single()

      if (blockError) {
        console.error("[v0] Error creating time block:", blockError)
        return NextResponse.json(
          { error: "Failed to create time block", details: blockError.message, success: false },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, stamp, block, status: "working" })

    } else if (action === "clock_out") {
      // Find the open block for today
      const { data: openBlock } = await supabase
        .from("time_blocks")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("user_id", user_id)
        .eq("date", today)
        .eq("is_open", true)
        .maybeSingle()

      if (!openBlock) {
        return NextResponse.json(
          { error: "No active time block found. Please clock in first.", success: false },
          { status: 400 }
        )
      }

      // Create an end stamp
      const { data: stamp, error: stampError } = await supabase
        .from("time_stamps")
        .insert({
          user_id,
          practice_id: practiceId,
          stamp_type: "stop",
          work_location: openBlock.work_location,
          timestamp: now.toISOString(),
          comment,
        })
        .select()
        .single()

      if (stampError) {
        console.error("[v0] Error creating end stamp:", stampError)
        return NextResponse.json(
          { error: "Failed to create time stamp", details: stampError.message, success: false },
          { status: 500 }
        )
      }

      // Calculate duration
      const startTime = new Date(openBlock.start_time)
      const grossMinutes = Math.round((now.getTime() - startTime.getTime()) / 60000)
      const breakMinutes = openBlock.break_minutes || 0
      const netMinutes = grossMinutes - breakMinutes

      // Update the time block
      const { data: block, error: blockError } = await supabase
        .from("time_blocks")
        .update({
          end_time: now.toISOString(),
          end_stamp_id: stamp.id,
          is_open: false,
          gross_minutes: grossMinutes,
          net_minutes: netMinutes,
        })
        .eq("id", openBlock.id)
        .select()
        .single()

      if (blockError) {
        console.error("[v0] Error updating time block:", blockError)
        return NextResponse.json(
          { error: "Failed to update time block", details: blockError.message, success: false },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, stamp, block, status: "idle" })
    }

    return NextResponse.json({ error: "Invalid action", success: false }, { status: 400 })
  } catch (error) {
    console.error("[v0] Error in time stamps API:", error)
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    )
  }
}

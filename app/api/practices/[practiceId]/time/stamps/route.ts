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
    
    if (isNaN(practiceId)) {
      return NextResponse.json(
        { error: "Invalid practice ID" },
        { status: 400 }
      )
    }
    
    const supabase = await createAdminClient()
    
    if (!supabase) {
      console.error("[v0] Supabase admin client not available - check SUPABASE_SERVICE_ROLE_KEY")
      return NextResponse.json(
        { error: "Datenbankverbindung nicht verfügbar. Bitte Konfiguration prüfen.", success: false },
        { status: 503 }
      )
    }
    
    const body = await request.json()
    const { user_id, action, location, comment } = body
    
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

    if (action === "clock_in") {
      console.log("[v0] Processing clock_in action for user:", user_id)
      // Check if there's already an open block for today
      // Try is_open column first, fallback to end_time is null
      let existingBlock = null
      
      const checkResult = await supabase
        .from("time_blocks")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("user_id", user_id)
        .eq("date", today)
        .eq("is_open", true)
        .maybeSingle()
      
      if (checkResult.error && (checkResult.error.code === '42703' || checkResult.error.code === 'PGRST204') && 
          checkResult.error.message.includes('is_open')) {
        // Fallback: check if end_time is null (meaning still open)
        const fallbackCheck = await supabase
          .from("time_blocks")
          .select("*")
          .eq("practice_id", practiceId)
          .eq("user_id", user_id)
          .eq("date", today)
          .is("end_time", null)
          .maybeSingle()
        existingBlock = fallbackCheck.data
      } else {
        existingBlock = checkResult.data
      }

      if (existingBlock) {
        return NextResponse.json(
          { error: "Already clocked in. Please clock out first.", success: false },
          { status: 400 }
        )
      }

      // Create a start stamp - try with comment first, fallback without if column doesn't exist
      let stamp, stampError
      
      const stampData: any = {
        user_id,
        practice_id: practiceId,
        stamp_type: "start",
        work_location: location || "office",
        timestamp: now.toISOString(),
      }
      
      // Only include comment if provided
      if (comment) {
        stampData.comment = comment
      }
      
      const result = await supabase
        .from("time_stamps")
        .insert(stampData)
        .select()
        .single()
      
      // If comment column doesn't exist, retry without it
      if (result.error && (result.error.code === '42703' || result.error.code === 'PGRST204') && 
          result.error.message.includes('comment')) {
        console.log("[v0] comment column not found, retrying without it")
        delete stampData.comment
        const fallbackResult = await supabase
          .from("time_stamps")
          .insert(stampData)
          .select()
          .single()
        stamp = fallbackResult.data
        stampError = fallbackResult.error
      } else {
        stamp = result.data
        stampError = result.error
      }

      if (stampError) {
        console.error("Error creating start stamp:", stampError)
        return NextResponse.json(
          { error: "Failed to create time stamp", details: stampError.message, success: false },
          { status: 500 }
        )
      }

      // Create a new time block - try with is_open first, fallback without if column doesn't exist
      const blockData: any = {
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
      }
      
      let block, blockError
      const blockResult = await supabase
        .from("time_blocks")
        .insert(blockData)
        .select()
        .single()
      
      // If is_open column doesn't exist, retry without it
      if (blockResult.error && (blockResult.error.code === '42703' || blockResult.error.code === 'PGRST204') && 
          blockResult.error.message.includes('is_open')) {
        console.log("[v0] is_open column not found in time_blocks, retrying without it")
        delete blockData.is_open
        const fallbackBlockResult = await supabase
          .from("time_blocks")
          .insert(blockData)
          .select()
          .single()
        block = fallbackBlockResult.data
        blockError = fallbackBlockResult.error
      } else {
        block = blockResult.data
        blockError = blockResult.error
      }

      if (blockError) {
        console.error("Error creating time block:", blockError)
        return NextResponse.json(
          { error: "Failed to create time block", details: blockError.message, success: false },
          { status: 500 }
        )
      }

      console.log("[v0] Clock in successful, block created:", block.id)
      return NextResponse.json({ success: true, stamp, block, status: "working" })

    } else if (action === "clock_out") {
      // Find the open block for today
      // Try is_open column first, fallback to end_time is null
      let openBlock = null
      
      const openBlockResult = await supabase
        .from("time_blocks")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("user_id", user_id)
        .eq("date", today)
        .eq("is_open", true)
        .maybeSingle()
      
      if (openBlockResult.error && (openBlockResult.error.code === '42703' || openBlockResult.error.code === 'PGRST204') && 
          openBlockResult.error.message.includes('is_open')) {
        // Fallback: check if end_time is null (meaning still open)
        const fallbackResult = await supabase
          .from("time_blocks")
          .select("*")
          .eq("practice_id", practiceId)
          .eq("user_id", user_id)
          .eq("date", today)
          .is("end_time", null)
          .maybeSingle()
        openBlock = fallbackResult.data
      } else {
        openBlock = openBlockResult.data
      }

      if (!openBlock) {
        return NextResponse.json(
          { error: "No active time block found. Please clock in first.", success: false },
          { status: 400 }
        )
      }

      // Create an end stamp - try with comment first, fallback without if column doesn't exist
      let stamp, stampError
      
      const endStampData: any = {
        user_id,
        practice_id: practiceId,
        stamp_type: "stop",
        work_location: openBlock.work_location,
        timestamp: now.toISOString(),
      }
      
      if (comment) {
        endStampData.comment = comment
      }
      
      const endResult = await supabase
        .from("time_stamps")
        .insert(endStampData)
        .select()
        .single()
      
      // If comment column doesn't exist, retry without it
      if (endResult.error && (endResult.error.code === '42703' || endResult.error.code === 'PGRST204') && 
          endResult.error.message.includes('comment')) {
        console.log("[v0] comment column not found in end stamp, retrying without it")
        delete endStampData.comment
        const fallbackResult = await supabase
          .from("time_stamps")
          .insert(endStampData)
          .select()
          .single()
        stamp = fallbackResult.data
        stampError = fallbackResult.error
      } else {
        stamp = endResult.data
        stampError = endResult.error
      }

      if (stampError) {
        console.error("Error creating end stamp:", stampError)
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

      // Update the time block - try with is_open first, fallback without if column doesn't exist
      const updateData: any = {
        end_time: now.toISOString(),
        end_stamp_id: stamp.id,
        is_open: false,
        gross_minutes: grossMinutes,
        net_minutes: netMinutes,
      }
      
      let block, blockError
      const updateResult = await supabase
        .from("time_blocks")
        .update(updateData)
        .eq("id", openBlock.id)
        .select()
        .single()
      
      // If is_open column doesn't exist, retry without it
      if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.code === 'PGRST204') && 
          updateResult.error.message.includes('is_open')) {
        console.log("[v0] is_open column not found in update, retrying without it")
        delete updateData.is_open
        const fallbackUpdateResult = await supabase
          .from("time_blocks")
          .update(updateData)
          .eq("id", openBlock.id)
          .select()
          .single()
        block = fallbackUpdateResult.data
        blockError = fallbackUpdateResult.error
      } else {
        block = updateResult.data
        blockError = updateResult.error
      }

      if (blockError) {
        console.error("Error updating time block:", blockError)
        return NextResponse.json(
          { error: "Failed to update time block", details: blockError.message, success: false },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, stamp, block, status: "idle" })
    }

    return NextResponse.json({ error: "Invalid action", success: false }, { status: 400 })
  } catch (error) {
    console.error("Error in time stamps API:", error)
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    )
  }
}

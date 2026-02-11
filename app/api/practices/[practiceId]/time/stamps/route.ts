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
    const { user_id, action, location, comment } = body

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 })
    }

    if (!action || !["clock_in", "clock_out"].includes(action)) {
      return NextResponse.json({ error: "action must be 'clock_in' or 'clock_out'" }, { status: 400 })
    }

    // Normalize location to match DB constraint
    const locationNormalized = location || "office"

    const now = new Date()
    const today = now.toISOString().split("T")[0]

    if (action === "clock_in") {
      // Check if there's already an open block
      const { data: existingBlock } = await supabase
        .from("time_blocks")
        .select("id")
        .eq("practice_id", practiceId)
        .eq("user_id", user_id)
        .eq("is_open", true)
        .maybeSingle()

      if (existingBlock) {
        return NextResponse.json(
          { error: "Bereits eingestempelt. Bitte zuerst ausstempeln.", success: false },
          { status: 400 }
        )
      }

      // Create start stamp
      const { data: stamp, error: stampError } = await supabase
        .from("time_stamps")
        .insert({
          user_id,
          practice_id: practiceId,
          stamp_type: "start",
          timestamp: now.toISOString(),
          location_type: location || "office",
          comment: comment || "",
        })
        .select()
        .single()

      if (stampError) {
        console.error("[API] Error creating start stamp:", stampError)
        return NextResponse.json({ error: stampError.message, success: false }, { status: 500 })
      }

      // Create open time block
      const { data: block, error: blockError } = await supabase
        .from("time_blocks")
        .insert({
          user_id,
          practice_id: practiceId,
          date: today,
          start_time: now.toISOString(),
          end_time: null,
          location_type: location || "office",
          status: "active",
          is_open: true,
          break_minutes: 0,
          notes: comment || null,
        })
        .select()
        .single()

      if (blockError) {
        console.error("[API] Error creating time block:", blockError)
        return NextResponse.json({ error: blockError.message, success: false }, { status: 500 })
      }

      return NextResponse.json({ success: true, stamp, block, status: "working" })
    }

    if (action === "clock_out") {
      // Find the open block
      const { data: openBlock, error: findError } = await supabase
        .from("time_blocks")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("user_id", user_id)
        .eq("is_open", true)
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (findError) {
        console.error("[API] Error finding open block:", findError)
        return NextResponse.json({ error: findError.message, success: false }, { status: 500 })
      }

      if (!openBlock) {
        return NextResponse.json(
          { error: "Kein aktiver Zeitblock gefunden. Bitte zuerst einstempeln.", success: false },
          { status: 400 }
        )
      }

      // Create end stamp
      const { data: stamp, error: stampError } = await supabase
        .from("time_stamps")
        .insert({
          user_id,
          practice_id: practiceId,
          stamp_type: "stop",
          timestamp: now.toISOString(),
          location_type: openBlock.location_type || "office",
          comment: comment || "",
        })
        .select()
        .single()

      if (stampError) {
        console.error("[API] Error creating end stamp:", stampError)
        return NextResponse.json({ error: stampError.message, success: false }, { status: 500 })
      }

      // Calculate duration
      const startTime = new Date(openBlock.start_time)
      const totalMinutes = (now.getTime() - startTime.getTime()) / 60000
      const breakMins = openBlock.break_minutes || 0
      const actualHours = Math.round(((totalMinutes - breakMins) / 60) * 100) / 100

      // Close the block
      const { data: updatedBlock, error: updateError } = await supabase
        .from("time_blocks")
        .update({
          end_time: now.toISOString(),
          is_open: false,
          status: "completed",
          actual_hours: actualHours,
          updated_at: now.toISOString(),
        })
        .eq("id", openBlock.id)
        .select()
        .single()

      if (updateError) {
        console.error("[API] Error closing time block:", updateError)
        return NextResponse.json({ error: updateError.message, success: false }, { status: 500 })
      }

      return NextResponse.json({ success: true, stamp, block: updatedBlock, status: "idle" })
    }

    return NextResponse.json({ error: "Invalid action", success: false }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}

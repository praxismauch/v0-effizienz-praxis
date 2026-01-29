import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(
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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")

    let query = supabase
      .from("time_correction_requests")
      .select("*, time_blocks(*)")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching corrections:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Corrections GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    const body = await request.json()

    const { userId, timeBlockId, correctionType, requestedChanges, reason } = body

    if (!userId || !timeBlockId || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: userId, timeBlockId, reason" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("time_correction_requests")
      .insert({
        practice_id: practiceId,
        user_id: userId,
        time_block_id: timeBlockId,
        correction_type: correctionType || "modify_time",
        requested_changes: requestedChanges,
        reason,
        status: "pending",
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] Error creating correction:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Corrections POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

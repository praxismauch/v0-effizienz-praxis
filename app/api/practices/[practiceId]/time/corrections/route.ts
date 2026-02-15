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
    const status = searchParams.get("status")

    let query = supabase
      .from("time_correction_requests")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (userId) query = query.eq("user_id", userId)
    if (status) query = query.eq("status", status)

    const { data, error } = await query

    if (error) {
      console.error("[API] Error fetching corrections:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enrich with time_block data if block_id exists
    const enriched = await Promise.all(
      (data || []).map(async (correction) => {
        if (correction.block_id) {
          const { data: block } = await supabase
            .from("time_blocks")
            .select("*")
            .eq("id", correction.block_id)
            .single()
          return { ...correction, time_block: block || null }
        }
        return { ...correction, time_block: null }
      })
    )

    return NextResponse.json(enriched)
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
    const { user_id, block_id, requested_start, requested_end, reason } = body

    if (!user_id || !reason) {
      return NextResponse.json({ error: "user_id and reason are required" }, { status: 400 })
    }

    // Get the original block times if a block is referenced
    let originalStart = null
    let originalEnd = null

    if (block_id) {
      const { data: block } = await supabase
        .from("time_blocks")
        .select("start_time, end_time")
        .eq("id", block_id)
        .single()

      if (block) {
        originalStart = block.start_time
        originalEnd = block.end_time
      }
    }

    const { data, error } = await supabase
      .from("time_correction_requests")
      .insert({
        practice_id: practiceId,
        user_id,
        block_id: block_id || null,
        original_start: originalStart,
        original_end: originalEnd,
        requested_start: requested_start || new Date().toISOString(),
        requested_end: requested_end || new Date().toISOString(),
        reason,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[API] Error creating correction:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, correction: data }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

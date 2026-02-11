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

    const { data, error } = await supabase
      .from("time_plausibility_checks")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("is_resolved", false)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[API] Error fetching plausibility checks:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
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
    const { id, is_resolved, resolution_notes, resolved_by } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("time_plausibility_checks")
      .update({
        is_resolved: is_resolved ?? true,
        resolution_notes: resolution_notes || null,
        resolved_by: resolved_by || null,
        resolved_at: is_resolved ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[API] Error updating plausibility check:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}

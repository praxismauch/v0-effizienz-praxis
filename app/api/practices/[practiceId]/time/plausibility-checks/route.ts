import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("time_plausibility_checks")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("is_resolved", false)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching plausibility checks:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Plausibility checks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const { id, is_resolved, resolution_notes } = body
    
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("time_plausibility_checks")
      .update({ is_resolved, resolution_notes, resolved_at: is_resolved ? new Date().toISOString() : null })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] Error updating plausibility check:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Plausibility check update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

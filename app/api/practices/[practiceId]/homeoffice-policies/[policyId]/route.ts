import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// PUT update existing homeoffice policy
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; policyId: string }> },
) {
  try {
    const { practiceId, policyId } = await params
    const body = await request.json()

    if (!practiceId || practiceId === "undefined") {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    if (!policyId || policyId === "undefined") {
      return NextResponse.json({ error: "Policy ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Verify policy exists and belongs to practice
    const { data: existing, error: checkError } = await supabase
      .from("homeoffice_policies")
      .select("id")
      .eq("id", policyId)
      .eq("practice_id", practiceId)
      .maybeSingle()

    if (checkError || !existing) {
      return NextResponse.json({ error: "Policy nicht gefunden" }, { status: 404 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Only update provided fields
    if (typeof body.is_allowed === "boolean") {
      updateData.is_allowed = body.is_allowed
    }
    if (body.allowed_days !== undefined) {
      updateData.allowed_days = body.allowed_days
    }
    if (body.allowed_start_time !== undefined) {
      updateData.allowed_start_time = body.allowed_start_time
    }
    if (body.allowed_end_time !== undefined) {
      updateData.allowed_end_time = body.allowed_end_time
    }
    if (body.max_days_per_week !== undefined) {
      updateData.max_days_per_week = body.max_days_per_week
    }
    if (typeof body.requires_reason === "boolean") {
      updateData.requires_reason = body.requires_reason
    }
    if (typeof body.requires_location_verification === "boolean") {
      updateData.requires_location_verification = body.requires_location_verification
    }

    const { data: policy, error } = await supabase
      .from("homeoffice_policies")
      .update(updateData)
      .eq("id", policyId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating homeoffice policy:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(policy)
  } catch (error) {
    console.error("[v0] Exception in PUT homeoffice policy:", error)
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 })
  }
}

// DELETE homeoffice policy
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; policyId: string }> },
) {
  try {
    const { practiceId, policyId } = await params

    if (!practiceId || practiceId === "undefined") {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    if (!policyId || policyId === "undefined") {
      return NextResponse.json({ error: "Policy ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Verify policy exists and belongs to practice
    const { data: existing, error: checkError } = await supabase
      .from("homeoffice_policies")
      .select("id")
      .eq("id", policyId)
      .eq("practice_id", practiceId)
      .maybeSingle()

    if (checkError || !existing) {
      return NextResponse.json({ error: "Policy nicht gefunden" }, { status: 404 })
    }

    const { error } = await supabase
      .from("homeoffice_policies")
      .delete()
      .eq("id", policyId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Error deleting homeoffice policy:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Exception in DELETE homeoffice policy:", error)
    return NextResponse.json({ error: "Failed to delete policy" }, { status: 500 })
  }
}

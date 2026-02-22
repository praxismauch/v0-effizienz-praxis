import { NextRequest, NextResponse } from "next/server"
import { getApiClient } from "@/lib/supabase/admin"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; planId: string }> }
) {
  try {
    const { practiceId, planId } = await params
    const supabase = await getApiClient()

    const { data: hygienePlan, error } = await supabase
      .from("hygiene_plans")
      .select("*")
      .eq("id", planId)
      .eq("practice_id", practiceId)
      .single()

    if (error) {
      console.error("[v0] Error fetching hygiene plan:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!hygienePlan) {
      return NextResponse.json({ error: "Hygiene plan not found" }, { status: 404 })
    }

    return NextResponse.json({ hygienePlan })
  } catch (error) {
    console.error("[v0] Error in hygiene plan GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; planId: string }> }
) {
  try {
    const { practiceId, planId } = await params
    const supabase = await getApiClient()
    const body = await request.json()

    const { data: hygienePlan, error } = await supabase
      .from("hygiene_plans")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating hygiene plan:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ hygienePlan })
  } catch (error) {
    console.error("[v0] Error in hygiene plan PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; planId: string }> }
) {
  try {
    const { practiceId, planId } = await params
    const supabase = await getApiClient()

    const { error } = await supabase.from("hygiene_plans").delete().eq("id", planId).eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Error deleting hygiene plan:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in hygiene plan DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

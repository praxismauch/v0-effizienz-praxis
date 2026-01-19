import { NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess, getEffectivePracticeId } from "@/lib/auth-helpers"

// GET - Get single IGEL analysis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; id: string }> }
) {
  try {
    const { practiceId: rawPracticeId, id } = await params
    const practiceId = getEffectivePracticeId(rawPracticeId)

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const { data, error } = await supabase
      .from("igel_analyses")
      .select("*")
      .eq("id", id)
      .eq("practice_id", practiceId)
      .single()

    if (error) {
      console.error("[v0] Error fetching IGEL analysis:", error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error in IGEL GET [id]:", error)
    
    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch IGEL analysis" },
      { status: 500 }
    )
  }
}

// PATCH - Update IGEL analysis
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; id: string }> }
) {
  try {
    const { practiceId: rawPracticeId, id } = await params
    const practiceId = getEffectivePracticeId(rawPracticeId)

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const body = await request.json()

    const { data, error } = await supabase
      .from("igel_analyses")
      .update({
        service_name: body.service_name,
        service_description: body.service_description,
        category: body.category,
        one_time_costs: body.one_time_costs,
        variable_costs: body.variable_costs,
        pricing_scenarios: body.pricing_scenarios,
        profitability_score: body.profitability_score,
        recommendation: body.recommendation,
        break_even_point: body.break_even_point,
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating IGEL analysis:", error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error in IGEL PATCH:", error)
    
    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update IGEL analysis" },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete IGEL analysis
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; id: string }> }
) {
  try {
    const { practiceId: rawPracticeId, id } = await params
    const practiceId = getEffectivePracticeId(rawPracticeId)

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const { error } = await supabase
      .from("igel_analyses")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Error deleting IGEL analysis:", error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error in IGEL DELETE:", error)
    
    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete IGEL analysis" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - Get single IGEL analysis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; analysisId: string }> }
) {
  try {
    const { practiceId, analysisId: id } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = await createAdminClient()

    const { data, error } = await adminClient
      .from("igel_analyses")
      .select("*")
      .eq("id", id)
      .eq("practice_id", practiceId)
      .single()

    if (error) {
      console.error(" Error fetching IGEL analysis:", error)
      throw error
    }

    return NextResponse.json({ analysis: data })
  } catch (error: any) {
    console.error(" Error in IGEL GET [id]:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch IGEL analysis" },
      { status: 500 }
    )
  }
}

// PATCH - Update IGEL analysis
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; analysisId: string }> }
) {
  try {
    const { practiceId, analysisId: id } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = await createAdminClient()
    const body = await request.json()

    const { data, error } = await adminClient
      .from("igel_analyses")
      .update({
        service_name: body.service_name,
        service_description: body.service_description,
        category: body.category,
        one_time_costs: body.one_time_costs,
        recurring_costs: body.recurring_costs,
        variable_costs: body.variable_costs,
        pricing_scenarios: body.pricing_scenarios,
        profitability_score: body.profitability_score,
        recommendation: body.recommendation,
        break_even_point: body.break_even_point,
        status: body.status,
        total_one_time_cost: body.total_one_time_cost,
        total_variable_cost: body.total_variable_cost,
        total_recurring_cost: body.total_recurring_cost,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error(" Error updating IGEL analysis:", error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error(" Error in IGEL PATCH:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update IGEL analysis" },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete IGEL analysis
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; analysisId: string }> }
) {
  try {
    const { practiceId, analysisId: id } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = await createAdminClient()

    const { error } = await adminClient
      .from("igel_analyses")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("practice_id", practiceId)

    if (error) {
      console.error(" Error deleting IGEL analysis:", error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(" Error in IGEL DELETE:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete IGEL analysis" },
      { status: 500 }
    )
  }
}

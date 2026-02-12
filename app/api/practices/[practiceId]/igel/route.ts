import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - List all IGEL analyses for a practice
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

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
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching IGEL analyses:", error)
      throw error
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("[v0] Error in IGEL GET:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch IGEL analyses" },
      { status: 500 }
    )
  }
}

// POST - Create a new IGEL analysis
export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

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
      .insert({
        practice_id: practiceId,
        service_name: body.service_name,
        service_description: body.service_description,
        category: body.category,
        one_time_costs: body.one_time_costs,
        recurring_costs: body.recurring_costs,
        variable_costs: body.variable_costs,
        total_one_time_cost: body.total_one_time_cost,
        total_variable_cost: body.total_variable_cost,
        total_recurring_cost: body.total_recurring_cost,
        pricing_scenarios: body.pricing_scenarios,
        profitability_score: body.profitability_score,
        recommendation: body.recommendation,
        break_even_point: body.break_even_point,
        status: body.status || "draft",
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating IGEL analysis:", error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error in IGEL POST:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create IGEL analysis" },
      { status: 500 }
    )
  }
}

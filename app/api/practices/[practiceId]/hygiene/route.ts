import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ practiceId: string }> },
) {
  const { practiceId } = await context.params
  const supabase = await createClient()

  try {
    const { data: plans, error } = await supabase
      .from("hygiene_plans")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ plans })
  } catch (error: any) {
    console.error("Error fetching hygiene plans:", error)
    return NextResponse.json(
      { error: "Failed to fetch hygiene plans", details: error.message },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ practiceId: string }> },
) {
  const { practiceId } = await context.params
  const supabase = await createClient()

  try {
    const body = await request.json()
    const {
      title,
      description,
      plan_type,
      area,
      frequency,
      procedure,
      responsible_role,
      products_used,
      documentation_required,
      rki_reference,
      status,
    } = body

    if (!title || !plan_type || !area || !frequency || !procedure) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      )
    }

    const { data: plan, error } = await supabase
      .from("hygiene_plans")
      .insert({
        practice_id: practiceId,
        title,
        description,
        plan_type,
        area,
        frequency,
        procedure,
        responsible_role,
        products_used,
        documentation_required: documentation_required ?? true,
        rki_reference,
        status: status || "active",
        version: 1,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating hygiene plan:", error)
    return NextResponse.json(
      { error: "Failed to create hygiene plan", details: error.message },
      { status: 500 },
    )
  }
}

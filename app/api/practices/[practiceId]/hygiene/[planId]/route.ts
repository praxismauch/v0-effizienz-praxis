import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ practiceId: string; planId: string }> },
) {
  const { practiceId, planId } = await context.params
  const supabase = await createClient()

  try {
    const { data: plan, error } = await supabase
      .from("hygiene_plans")
      .select("*")
      .eq("id", planId)
      .eq("practice_id", practiceId)
      .single()

    if (error) throw error

    return NextResponse.json({ plan })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to fetch hygiene plan", details: message },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ practiceId: string; planId: string }> },
) {
  const { practiceId, planId } = await context.params
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

    // Get current version to increment
    const { data: current } = await supabase
      .from("hygiene_plans")
      .select("version")
      .eq("id", planId)
      .eq("practice_id", practiceId)
      .single()

    const { data: plan, error } = await supabase
      .from("hygiene_plans")
      .update({
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
        version: (current?.version || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ plan })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to update hygiene plan", details: message },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ practiceId: string; planId: string }> },
) {
  const { practiceId, planId } = await context.params
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from("hygiene_plans")
      .delete()
      .eq("id", planId)
      .eq("practice_id", practiceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to delete hygiene plan", details: message },
      { status: 500 },
    )
  }
}

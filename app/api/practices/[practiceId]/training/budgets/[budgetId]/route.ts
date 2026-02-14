import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; budgetId: string }> }
) {
  try {
    const { practiceId, budgetId } = await params
    const body = await request.json()

    const supabase = await createAdminClient()

    const allowedFields = [
      "year",
      "budget_amount",
      "currency",
      "team_member_id",
      "team_id",
      "notes",
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Convert empty strings to null for FK fields
    if (updateData.team_member_id === "") updateData.team_member_id = null
    if (updateData.team_id === "") updateData.team_id = null

    const { data, error } = await supabase
      .from("training_budgets")
      .update(updateData)
      .eq("id", budgetId)
      .eq("practice_id", practiceId)
      .select(`
        *,
        team_member:team_members(id, first_name, last_name),
        team:teams(id, name, color)
      `)
      .single()

    if (error) {
      console.error("Error updating budget:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ budget: data })
  } catch (error) {
    console.error("Error in budget PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; budgetId: string }> }
) {
  try {
    const { practiceId, budgetId } = await params

    const supabase = await createAdminClient()

    // Soft delete
    const { error } = await supabase
      .from("training_budgets")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", budgetId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("Error deleting budget:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in budget DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

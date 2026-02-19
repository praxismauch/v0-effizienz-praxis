import { getApiClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; budgetId: string }> }
) {
  try {
    const { practiceId, budgetId } = await params
    const body = await request.json()

    const supabase = await getApiClient()

    const allowedFields = [
      "year",
      "budget_amount",
      "spent_amount",
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

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("training_budgets")
      .update(updateData)
      .eq("id", budgetId)
      .eq("practice_id", practiceId)
      .select("*")
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

    const supabase = await getApiClient()

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

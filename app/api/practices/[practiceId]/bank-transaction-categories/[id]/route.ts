import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PATCH(request: Request, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params
    const body = await request.json()

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("bank_transaction_categories")
      .update({
        name: body.name,
        color: body.color,
        description: body.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("Error updating bank transaction category:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error in PATCH bank transaction category:", error)
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params

    const supabase = await createAdminClient()

    const { error } = await supabase
      .from("bank_transaction_categories")
      .delete()
      .eq("id", id)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("Error deleting bank transaction category:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { success: true },
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error in DELETE bank transaction category:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: { practiceId: string; id: string } }) {
  try {
    const practiceIdText = String(params.practiceId)
    const idText = String(params.id)

    const supabase = await createClient()
    const { category } = await request.json()

    const { data, error } = await supabase
      .from("bank_transactions")
      .update({ category, updated_at: new Date().toISOString() })
      .eq("id", idText)
      .eq("practice_id", practiceIdText)
      .select()
      .single()

    if (error) {
      console.error("Error updating transaction:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PATCH bank transaction:", error)
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
  }
}

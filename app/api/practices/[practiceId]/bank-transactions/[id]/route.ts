import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params
    const { adminClient } = await requirePracticeAccess(practiceId)

    const { category } = await request.json()

    const { data, error } = await adminClient
      .from("bank_transactions")
      .update({ category, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("Error updating transaction:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}

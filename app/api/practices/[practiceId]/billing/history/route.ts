import { NextResponse } from "next/server"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"

// GET - Get billing history for practice
export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { adminClient } = await requirePracticeAccess(practiceId)

    const { data: history, error } = await adminClient
      .from("billing_history")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(history || [])
  } catch (error) {
    return handleApiError(error)
  }
}

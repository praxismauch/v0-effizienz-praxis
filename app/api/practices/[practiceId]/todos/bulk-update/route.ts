import { type NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    // Validate practiceId - return error if invalid
    if (!practiceId || practiceId === "0" || practiceId === "undefined" || practiceId === "null") {
      return NextResponse.json({ error: "Invalid practice ID" }, { status: 400 })
    }
    const effectivePracticeId = String(practiceId)

    const { adminClient: supabase } = await requirePracticeAccess(effectivePracticeId)

    const { todoIds, updates } = body

    if (!todoIds || !Array.isArray(todoIds) || todoIds.length === 0) {
      return NextResponse.json({ error: "todoIds array is required" }, { status: 400 })
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "updates object is required" }, { status: 400 })
    }

    // Remove fields that shouldn't be updated in bulk
    const { id, created_at, practice_id, ...safeUpdates } = updates

    const updatePayload = {
      ...safeUpdates,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("todos")
      .update(updatePayload)
      .in("id", todoIds)
      .eq("practice_id", effectivePracticeId)
      .is("deleted_at", null)
      .select()

    if (error) {
      console.error("[v0] Error in bulk update:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
      data,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

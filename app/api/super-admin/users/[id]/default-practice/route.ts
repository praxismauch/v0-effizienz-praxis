import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("[v0] API route called - default-practice PATCH")

  try {
    const supabase = await createAdminClient()
    const { id: userId } = params
    const body = await request.json()
    const { practiceId } = body

    console.log("[v0] Updating default practice:", {
      userId,
      practiceId,
      practiceIdType: typeof practiceId,
      bodyReceived: body,
    })

    if (!userId) {
      console.error("[v0] No userId provided")
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (
      practiceId !== null &&
      practiceId !== undefined &&
      typeof practiceId !== "string" &&
      typeof practiceId !== "number"
    ) {
      console.error("[v0] Invalid practiceId type:", typeof practiceId, practiceId)
      return NextResponse.json({ error: "Invalid practice ID format" }, { status: 400 })
    }

    const practiceIdValue = practiceId === null || practiceId === undefined ? null : String(practiceId)

    console.log("[v0] Executing update query with:", { userId, practiceIdValue })

    console.log("[v0] About to execute Supabase update...")

    const { data, error } = await supabase
      .from("users")
      .update({ default_practice_id: practiceIdValue })
      .eq("id", String(userId))
      .select()

    console.log("[v0] Supabase update completed:", { hasError: !!error, hasData: !!data })

    if (data && data.length > 0) {
      console.log("[v0] Updated user data:", {
        userId: data[0].id,
        practice_id: data[0].practice_id,
        default_practice_id: data[0].default_practice_id,
        fullData: data[0],
      })
    }

    if (error) {
      console.error("[v0] Supabase error updating default practice:", {
        error,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        errorCode: error.code,
      })
      return NextResponse.json({ error: error.message || "Database error" }, { status: 500 })
    }

    console.log("[v0] Default practice updated successfully:", { data, updatedRows: data?.length })

    if (!data || data.length === 0) {
      console.error("[v0] No rows were updated - user might not exist:", userId)
      return NextResponse.json({ error: "User not found or no changes made" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: data[0] })
  } catch (error) {
    console.error("[v0] Exception in default practice update:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: "Failed to update default practice",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

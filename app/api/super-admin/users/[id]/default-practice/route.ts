import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id: userId } = await params
    const body = await request.json()
    const { practiceId } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (
      practiceId !== null &&
      practiceId !== undefined &&
      typeof practiceId !== "string" &&
      typeof practiceId !== "number"
    ) {
      return NextResponse.json({ error: "Invalid practice ID format" }, { status: 400 })
    }

    const practiceIdValue = practiceId === null || practiceId === undefined ? null : String(practiceId)

    const { data, error } = await supabase
      .from("users")
      .update({ default_practice_id: practiceIdValue })
      .eq("id", String(userId))
      .select()

    if (error) {
      console.error("Error updating default practice:", error.message)
      return NextResponse.json({ error: error.message || "Database error" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "User not found or no changes made" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: data[0] })
  } catch (error) {
    console.error("Error in default practice update:", error)
    return NextResponse.json(
      {
        error: "Failed to update default practice",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

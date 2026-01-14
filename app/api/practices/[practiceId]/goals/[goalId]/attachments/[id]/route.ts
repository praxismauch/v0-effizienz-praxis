import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; goalId: string; id: string }> },
) {
  const { practiceId, goalId, id } = await params

  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("goal_attachments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .eq("goal_id", goalId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting goal attachment:", error)
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 })
  }
}

import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; id: string }> },
) {
  try {
    const { practiceId, id } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("holidays")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("practice_id", practiceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting holiday:", error)
    return NextResponse.json({ error: "Failed to delete holiday" }, { status: 500 })
  }
}

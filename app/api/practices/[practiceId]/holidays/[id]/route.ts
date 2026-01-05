import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: { practiceId: string; id: string } }) {
  try {
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
      .eq("id", params.id)
      .eq("practice_id", params.practiceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting holiday:", error)
    return NextResponse.json({ error: "Failed to delete holiday" }, { status: 500 })
  }
}

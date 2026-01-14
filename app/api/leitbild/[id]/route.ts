import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const practiceId = url.searchParams.get("practiceId")

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: leitbild } = await supabase
      .from("leitbild")
      .select("is_active")
      .eq("id", id)
      .eq("practice_id", practiceId)
      .maybeSingle()

    if (!leitbild) {
      return NextResponse.json({ error: "Leitbild nicht gefunden" }, { status: 404 })
    }

    if (leitbild.is_active) {
      return NextResponse.json(
        { error: "Cannot delete the active version. Please activate another version first." },
        { status: 400 },
      )
    }

    // Delete the version
    const { error } = await supabase.from("leitbild").delete().eq("id", id).eq("practice_id", practiceId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting leitbild version:", error)
    return NextResponse.json({ error: error.message || "Failed to delete version" }, { status: 500 })
  }
}

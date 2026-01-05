import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { practiceId } = await request.json()

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Deactivate all versions for this practice
    await supabase.from("leitbild").update({ is_active: false }).eq("practice_id", practiceId)

    // Activate the selected version
    const { data, error } = await supabase
      .from("leitbild")
      .update({ is_active: true })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[v0] Error activating leitbild version:", error)
    return NextResponse.json({ error: error.message || "Failed to activate version" }, { status: 500 })
  }
}

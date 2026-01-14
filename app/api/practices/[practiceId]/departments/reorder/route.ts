import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const supabase = await createClient()
    const { practiceId } = await params
    const { departmentIds } = await request.json()

    // Update display_order for each department
    const updates = departmentIds.map((id: string, index: number) =>
      supabase.from("departments").update({ display_order: index }).eq("id", id).eq("practice_id", practiceId),
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Departments reorder error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

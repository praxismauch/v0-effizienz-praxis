import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params
    const body = await req.json()
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("staffing_plans")
      .update({
        name: body.name,
        description: body.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[API] Error updating staffing plan:", error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[API] Error in PUT staffing plan:", error)
    return NextResponse.json({ error: error.message || "Failed to update plan" }, { status: 200 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from("staffing_plans")
      .update({ is_active: false })
      .eq("id", id)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[API] Error deleting staffing plan:", error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[API] Error in DELETE staffing plan:", error)
    return NextResponse.json({ error: error.message || "Failed to delete plan" }, { status: 200 })
  }
}

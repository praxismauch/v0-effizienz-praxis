import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { practiceId, id } = await params
    const body = await request.json()

    const { data: department, error } = await supabase
      .from("departments")
      .update({
        name: body.name,
        description: body.description,
        color: body.color,
        icon: body.icon,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] Error updating department:", error)
      return NextResponse.json({ error: "Failed to update department" }, { status: 500 })
    }

    if (!department) {
      return NextResponse.json({ error: "Abteilung nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json({ department })
  } catch (error) {
    console.error("[v0] Departments PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; id: string }> },
) {
  try {
    const supabase = await createAdminClient()
    const { practiceId, id } = await params

    const { error } = await supabase.from("departments").delete().eq("id", id).eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Error deleting department:", error)
      return NextResponse.json({ error: "Failed to delete department" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Departments DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

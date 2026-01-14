import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params

    const body = await request.json()

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("interview_templates")
      .update({
        name: body.name,
        description: body.description,
        content: body.content,
        category: body.category,
        is_default: body.is_default,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data, {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[v0] Error updating interview template:", error)
    return NextResponse.json(
      { error: "Failed to update interview template" },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; id: string }> },
) {
  try {
    const { practiceId, id } = await params

    const supabase = await createAdminClient()

    const { error } = await supabase.from("interview_templates").delete().eq("id", id).eq("practice_id", practiceId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true }, { headers: { "Content-Type": "application/json" } })
  } catch (error) {
    console.error("[v0] Error deleting interview template:", error)
    return NextResponse.json(
      { error: "Failed to delete interview template" },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}

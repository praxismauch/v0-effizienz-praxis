import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// PUT /api/practices/[practiceId]/parameter-groups/[id] - Update a practice-specific parameter group
export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const supabase = await createClient()
    const { practiceId, id } = await params
    const body = await request.json()

    const { name, description, color, parameters, isActive } = body

    const { data: category, error } = await supabase
      .from("global_parameter_groups")
      .update({
        name,
        description,
        color,
        parameters,
        is_active: isActive,
      })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("Error updating practice parameter group:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Error in PUT /api/practices/[practiceId]/parameter-groups/[id]:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

// DELETE /api/practices/[practiceId]/parameter-groups/[id] - Delete a practice-specific parameter group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; id: string }> },
) {
  try {
    const { practiceId, id } = await params
    const supabase = await createClient()

    // Delete the category - only deletes if it belongs to this practice
    const { data, error } = await supabase
      .from("global_parameter_groups")
      .delete()
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()

    if (error) {
      console.error("Supabase error deleting parameter group:", error)
      return NextResponse.json({ error: "Failed to delete category", details: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Category not found or access denied" }, { status: 404 })
    }

    return NextResponse.json({ success: true, deleted: data })
  } catch (error) {
    console.error("Exception in DELETE handler:", error)
    return NextResponse.json(
      { error: "Failed to delete category", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

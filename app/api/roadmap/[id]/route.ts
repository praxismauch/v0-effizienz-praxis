import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET - Einzelnes Roadmap Item abrufen
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("roadmap_items")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching roadmap item:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Roadmap Item nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error("[v0] Error in GET /api/roadmap/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Roadmap Item aktualisieren
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    const updateData: Record<string, unknown> = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) {
      updateData.status = body.status
      if (body.status === "completed") {
        updateData.completed_at = new Date().toISOString()
      }
    }
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.effort !== undefined) updateData.effort = body.effort
    if (body.impact !== undefined) updateData.impact = body.impact
    if (body.category !== undefined) updateData.category = body.category
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.target_date !== undefined) updateData.target_date = body.target_date || null
    if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to
    if (body.metadata !== undefined) updateData.metadata = body.metadata
    if (body.display_order !== undefined) updateData.display_order = body.display_order
    if (body.votes !== undefined) updateData.votes = body.votes

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("roadmap_items").update(updateData).eq("id", id).select().maybeSingle()

    if (error) {
      console.error("[v0] Error updating roadmap item:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Roadmap Item nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/roadmap/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Roadmap Item löschen (soft delete)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const { error } = await supabase.from("roadmap_items").update({ deleted_at: new Date().toISOString() }).eq("id", id)

    if (error) {
      console.error("[v0] Error deleting roadmap item:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/roadmap/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

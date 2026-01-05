import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    const { positions, clearExisting } = body

    if (!Array.isArray(positions) || positions.length === 0) {
      return NextResponse.json({ error: "positions array is required" }, { status: 400 })
    }

    // If clearExisting is true, soft-delete existing positions first
    if (clearExisting) {
      const { error: deleteError } = await supabase
        .from("org_chart_positions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("practice_id", practiceId)
        .is("deleted_at", null)

      if (deleteError) {
        console.error("[v0] Error clearing existing positions:", deleteError)
        return NextResponse.json(
          { error: "Failed to clear existing positions", details: deleteError.message },
          { status: 500 },
        )
      }
    }

    // Prepare positions with practice_id and timestamps
    const positionsToInsert = positions.map((pos: any) => ({
      id: pos.id || crypto.randomUUID(),
      practice_id: practiceId,
      position_title: pos.position_title,
      department: pos.department || null,
      person_name: pos.person_name || null,
      person_role: pos.person_role || null,
      reports_to_position_id: pos.reports_to_position_id || null,
      level: pos.level || 0,
      display_order: pos.display_order || 0,
      is_active: pos.is_active !== false,
      color: pos.color || null,
      is_management: pos.is_management || false,
      created_by: pos.created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase.from("org_chart_positions").insert(positionsToInsert).select()

    if (error) {
      console.error("[v0] Error batch creating positions:", error)
      return NextResponse.json({ error: "Failed to create positions", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ positions: data, count: data?.length || 0 }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in batch create positions:", error)
    return NextResponse.json(
      { error: "Failed to create positions", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

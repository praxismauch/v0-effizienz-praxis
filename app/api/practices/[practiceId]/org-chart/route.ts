import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()

    const { data: positions, error } = await supabase
      .from("org_chart_positions")
      .select(`
        id,
        practice_id,
        position_title,
        department,
        person_name,
        person_role,
        reports_to_position_id,
        level,
        display_order,
        is_active,
        color,
        created_by,
        created_at,
        updated_at
      `)
      .eq("practice_id", practiceId)
      .or("is_active.eq.true,is_active.is.null")
      .order("level", { ascending: true })
      .order("display_order", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching org chart:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch org chart",
          details: error.message,
        },
        { status: 500 },
      )
    }

    const positionsWithManagement = (positions || []).map((pos: any) => ({
      ...pos,
      is_management: pos.level <= 1,
    }))

    return NextResponse.json(positionsWithManagement)
  } catch (error) {
    console.error("[v0] Error fetching org chart:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch org chart",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    const createdBy = body.created_by || body.createdBy
    if (!createdBy) {
      return NextResponse.json({ error: "created_by is required" }, { status: 400 })
    }

    const reportsToPositionId = body.reports_to_position_id || body.reportsToPositionId

    const positionData = {
      practice_id: practiceId,
      position_title: body.position_title || body.positionTitle,
      department: body.department || null,
      person_name: body.person_name || body.personName || null,
      person_role: body.person_role || body.personRole || null,
      reports_to_position_id: reportsToPositionId === "none" ? null : reportsToPositionId || null,
      level: body.level || 0,
      display_order: body.display_order || body.displayOrder || 0,
      is_active: true,
      color: body.color || null,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: position, error } = await supabase
      .from("org_chart_positions")
      .insert([positionData])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating org chart position:", error)
      return NextResponse.json(
        {
          error: "Failed to create position",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(position, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating org chart position:", error)
    return NextResponse.json(
      {
        error: "Failed to create position",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

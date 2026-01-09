import { type NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess } from "@/lib/api-helpers"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const { data: positions, error } = await supabase
      .from("org_chart_positions")
      .select(`
        id,
        practice_id,
        position_title,
        department,
        user_id,
        reports_to_position_id,
        level,
        display_order,
        is_active,
        is_management,
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
      is_management: pos.is_management ?? pos.level <= 1,
    }))

    return NextResponse.json(positionsWithManagement)
  } catch (error: any) {
    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
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
    const body = await request.json()

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const reportsToPositionId = body.reports_to_position_id || body.reportsToPositionId

    const positionData = {
      practice_id: practiceId,
      position_title: body.position_title || body.positionTitle,
      department: body.department || null,
      user_id: body.user_id || body.userId || null,
      reports_to_position_id: reportsToPositionId === "none" ? null : reportsToPositionId || null,
      level: body.level || 0,
      display_order: body.display_order || body.displayOrder || 0,
      is_active: true,
      is_management: body.is_management || body.isManagement || false,
      color: body.color || null,
      created_by: access.user.id,
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
  } catch (error: any) {
    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
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

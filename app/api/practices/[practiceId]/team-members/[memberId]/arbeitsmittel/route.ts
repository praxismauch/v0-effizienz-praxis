import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin-client"
import { requirePracticeAccess, getEffectivePracticeId } from "@/lib/auth-utils"

// GET - Fetch arbeitsmittel assignments for a specific team member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> }
) {
  try {
    const { practiceId: rawPracticeId, memberId } = await params
    const practiceId = getEffectivePracticeId(rawPracticeId)

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    console.log("[v0] Fetching arbeitsmittel for member:", memberId, "in practice:", practiceId)

    // Fetch assignments
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from("team_member_arbeitsmittel")
      .select("*")
      .eq("team_member_id", memberId)
      .eq("practice_id", practiceId)
      .order("given_date", { ascending: false })

    if (assignmentsError) throw assignmentsError

    if (!assignmentsData || assignmentsData.length === 0) {
      return NextResponse.json([])
    }

    // Fetch arbeitsmittel details
    const arbeitsmittelIds = assignmentsData.map((a) => a.arbeitsmittel_id).filter(Boolean)

    const { data: arbeitsmittelData, error: arbeitsmittelError } = await supabase
      .from("arbeitsmittel")
      .select("id, name, category, serial_number")
      .in("id", arbeitsmittelIds)

    if (arbeitsmittelError) throw arbeitsmittelError

    // Join data
    const joinedData = assignmentsData.map((assignment) => ({
      ...assignment,
      arbeitsmittel: arbeitsmittelData?.find((a) => a.id === assignment.arbeitsmittel_id) || null,
    }))

    return NextResponse.json(joinedData)
  } catch (error: any) {
    console.error("[v0] Error fetching team member arbeitsmittel:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch arbeitsmittel" },
      { status: 500 }
    )
  }
}

// POST - Create new arbeitsmittel assignment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> }
) {
  try {
    const { practiceId: rawPracticeId, memberId } = await params
    const practiceId = getEffectivePracticeId(rawPracticeId)

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const body = await request.json()

    console.log("[v0] Creating arbeitsmittel assignment for member:", memberId)

    const { data, error } = await supabase
      .from("team_member_arbeitsmittel")
      .insert({
        practice_id: practiceId,
        team_member_id: memberId,
        arbeitsmittel_id: body.arbeitsmittel_id,
        given_date: body.given_date,
        expected_return_date: body.expected_return_date,
        description: body.description,
        status: "ausgegeben",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error creating arbeitsmittel assignment:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create assignment" },
      { status: 500 }
    )
  }
}

import { NextResponse, type NextRequest } from "next/server"
import { requirePracticeAccess, getEffectivePracticeId } from "@/lib/auth-utils"

// GET - Fetch all quality circle actions
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId: rawPracticeId } = await params
    const practiceId = getEffectivePracticeId(rawPracticeId)

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const { data, error } = await supabase
      .from("quality_circle_actions")
      .select("*, assignee:assigned_to(first_name, last_name)")
      .eq("practice_id", practiceId)
      .order("due_date", { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("[v0] Error fetching quality circle actions:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: "Failed to fetch actions" }, { status: 500 })
  }
}

// POST - Create a new action
export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId: rawPracticeId } = await params
    const practiceId = getEffectivePracticeId(rawPracticeId)

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const body = await request.json()

    const { data, error } = await supabase
      .from("quality_circle_actions")
      .insert({
        ...body,
        practice_id: practiceId,
        created_by: access.user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error creating action:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: "Failed to create action" }, { status: 500 })
  }
}

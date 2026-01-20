import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isRateLimitError } from "@/lib/supabase/safe-query"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params
    const { searchParams } = new URL(request.url)
    const skillId = searchParams.get("skillId")

    if (!practiceId || !memberId) {
      return NextResponse.json([])
    }

    let supabase
    try {
      supabase = createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json([])
      }
      throw err
    }

    // TODO: team_member_skills_history table doesn't exist yet
    // Return empty array until table is created
    let query = supabase.from("team_member_skills_history").select()
    if (skillId) {
      query = query.eq("skill_id", skillId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Skill history error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Skill history GET error:", error)
    if (isRateLimitError(error)) {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: "Fehler beim Laden der Historie" }, { status: 500 })
  }
}

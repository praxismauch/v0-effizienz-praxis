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

    // Skill history uses system_changes table to track skill-related changes
    // since there is no dedicated team_member_skills_history table
    let query = supabase
      .from("system_changes")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("entity_type", "skill")
      .order("created_at", { ascending: false })

    if (skillId) {
      query = query.eq("entity_id", skillId)
    }

    const { data, error } = await query

    if (error) {
      // Table may not have matching records - return empty gracefully
      console.error("Skill history error:", error)
      return NextResponse.json([])
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

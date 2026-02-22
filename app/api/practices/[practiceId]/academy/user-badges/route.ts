import { type NextRequest, NextResponse } from "next/server"
import { getApiClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await getApiClient()

    const effectivePracticeId =
      !practiceId || practiceId === "0" || practiceId === "undefined" ? "1" : practiceId

    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    let query = supabase
      .from("academy_user_badges")
      .select(`
        *,
        badge:academy_badges(*)
      `)
      .eq("practice_id", effectivePracticeId)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data: userBadges, error } = await query.order("earned_at", { ascending: false })

    if (error) {
      console.error("[v0] User badges query error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(userBadges || [])
  } catch (error: any) {
    console.error("[v0] Error fetching user badges:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await getApiClient()

    const effectivePracticeId =
      !practiceId || practiceId === "0" || practiceId === "undefined" ? "1" : practiceId

    const body = await request.json()
    const { userId, badgeId, criteriaMet } = body

    if (!userId || !badgeId) {
      return NextResponse.json({ error: "userId and badgeId are required" }, { status: 400 })
    }

    // Check if badge already earned
    const { data: existing } = await supabase
      .from("academy_user_badges")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_id", badgeId)
      .eq("practice_id", effectivePracticeId)
      .single()

    if (existing) {
      return NextResponse.json({ message: "Badge already earned", userBadge: existing })
    }

    const userBadgeData = {
      user_id: userId,
      badge_id: badgeId,
      practice_id: effectivePracticeId,
      earned_at: new Date().toISOString(),
      criteria_met: criteriaMet || {},
    }

    const { data: userBadge, error } = await supabase
      .from("academy_user_badges")
      .insert(userBadgeData)
      .select()
      .single()

    if (error) {
      console.error("[v0] Badge award error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(userBadge)
  } catch (error: any) {
    console.error("[v0] Error awarding badge:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

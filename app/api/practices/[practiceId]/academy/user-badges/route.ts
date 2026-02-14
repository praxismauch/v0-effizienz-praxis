import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server-admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const effectivePracticeId =
      !practiceId || practiceId === "0" || practiceId === "undefined" ? 1 : Number.parseInt(practiceId)

    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    console.log("[v0] Fetching user badges for practice:", effectivePracticeId, "user:", userId)

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

    console.log("[v0] Found user badges:", userBadges?.length || 0)
    return NextResponse.json(userBadges || [])
  } catch (error: any) {
    console.error("[v0] Error fetching user badges:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const effectivePracticeId =
      !practiceId || practiceId === "0" || practiceId === "undefined" ? 1 : Number.parseInt(practiceId)

    const body = await request.json()
    const { userId, badgeId, criteriaMet } = body

    if (!userId || !badgeId) {
      return NextResponse.json({ error: "userId and badgeId are required" }, { status: 400 })
    }

    console.log("[v0] Awarding badge to user:", { userId, badgeId, practiceId: effectivePracticeId })

    // Check if badge already earned
    const { data: existing } = await supabase
      .from("academy_user_badges")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_id", badgeId)
      .eq("practice_id", effectivePracticeId)
      .single()

    if (existing) {
      console.log("[v0] Badge already earned")
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

    console.log("[v0] Badge awarded:", userBadge.id)
    return NextResponse.json(userBadge)
  } catch (error: any) {
    console.error("[v0] Error awarding badge:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

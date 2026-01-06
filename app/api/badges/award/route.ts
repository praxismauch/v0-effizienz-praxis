import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()
    const { userId, practiceId, badgeId } = body

    if (!userId || !practiceId || !badgeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the badge by badge_id
    const { data: badge, error: badgeError } = await supabase
      .from("academy_badges")
      .select("*")
      .eq("badge_id", badgeId)
      .single()

    if (badgeError || !badge) {
      console.error("Badge not found:", badgeId)
      return NextResponse.json({ error: "Badge not found" }, { status: 404 })
    }

    // Check if user already has this badge
    const { data: existingBadge } = await supabase
      .from("academy_user_badges")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_id", badge.id)
      .single()

    if (existingBadge) {
      return NextResponse.json({
        message: "Badge already earned",
        badge,
        alreadyEarned: true,
      })
    }

    // Award the badge
    const { data: userBadge, error: insertError } = await supabase
      .from("academy_user_badges")
      .insert({
        user_id: userId,
        practice_id: Number.parseInt(practiceId),
        badge_id: badge.id,
        earned_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error awarding badge:", insertError)
      return NextResponse.json({ error: "Failed to award badge" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      badge,
      userBadge,
      alreadyEarned: false,
    })
  } catch (error) {
    console.error("Error in badge award:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

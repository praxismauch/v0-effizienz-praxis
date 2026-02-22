import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// System badges that are auto-created when first triggered
const SYSTEM_BADGES: Record<string, { name: string; description: string; icon_name: string; color: string; xp_reward: number; criteria_type: string }> = {
  welcome_tour: {
    name: "Welcome Tour",
    description: "Willkommen! Du hast die Einführungstour erfolgreich abgeschlossen.",
    icon_name: "Rocket",
    color: "#6366f1",
    xp_reward: 50,
    criteria_type: "welcome_tour",
  },
  first_login: {
    name: "Erster Login",
    description: "Du hast dich zum ersten Mal angemeldet.",
    icon_name: "LogIn",
    color: "#22c55e",
    xp_reward: 10,
    criteria_type: "first_login",
  },
  profile_complete: {
    name: "Profil komplett",
    description: "Du hast dein Profil vollständig ausgefüllt.",
    icon_name: "UserCheck",
    color: "#3b82f6",
    xp_reward: 30,
    criteria_type: "profile_complete",
  },
  first_ticket: {
    name: "Erstes Ticket",
    description: "Du hast dein erstes Ticket erstellt.",
    icon_name: "Ticket",
    color: "#f59e0b",
    xp_reward: 20,
    criteria_type: "first_ticket",
  },
  first_protocol: {
    name: "Erstes Protokoll",
    description: "Du hast dein erstes Protokoll erstellt.",
    icon_name: "FileText",
    color: "#8b5cf6",
    xp_reward: 20,
    criteria_type: "first_protocol",
  },
  first_document: {
    name: "Erstes Dokument",
    description: "Du hast dein erstes Dokument hochgeladen.",
    icon_name: "Upload",
    color: "#06b6d4",
    xp_reward: 20,
    criteria_type: "first_document",
  },
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()
    const { userId, practiceId, badgeId } = body

    if (!userId || !practiceId || !badgeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the badge by id first, then fallback to criteria_type
    let badge: any = null

    const { data: badgeById } = await supabase
      .from("academy_badges")
      .select("*")
      .eq("id", badgeId)
      .maybeSingle()

    if (badgeById) {
      badge = badgeById
    } else {
      // Fallback: find by criteria_type (for action-based awards like "welcome_tour")
      const { data: badgeByCriteria } = await supabase
        .from("academy_badges")
        .select("*")
        .eq("criteria_type", badgeId)
        .eq("is_active", true)
        .maybeSingle()
      badge = badgeByCriteria
    }

    // If badge not found, auto-create it if it's a known system badge
    if (!badge && SYSTEM_BADGES[badgeId]) {
      const systemBadge = SYSTEM_BADGES[badgeId]
      const { data: newBadge, error: createError } = await supabase
        .from("academy_badges")
        .insert({
          name: systemBadge.name,
          description: systemBadge.description,
          icon_name: systemBadge.icon_name,
          color: systemBadge.color,
          xp_reward: systemBadge.xp_reward,
          criteria_type: systemBadge.criteria_type,
          criteria_value: "",
          is_active: true,
          practice_id: practiceId,
        })
        .select()
        .single()

      if (createError) {
        console.error("[v0] Error creating system badge:", createError)
        return NextResponse.json({ error: "Failed to create system badge" }, { status: 500 })
      }
      badge = newBadge
    }

    if (!badge) {
      console.error("[v0] Badge not found and not a system badge:", badgeId)
      return NextResponse.json({ error: "Badge not found" }, { status: 404 })
    }

    // Check if user already has this badge
    const { data: existingBadge } = await supabase
      .from("academy_user_badges")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_id", badge.id)
      .maybeSingle()

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
        practice_id: practiceId,
        badge_id: badge.id,
        earned_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error awarding badge:", insertError)
      return NextResponse.json({ error: "Failed to award badge" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      badge,
      userBadge,
      alreadyEarned: false,
    })
  } catch (error) {
    console.error("[v0] Error in badge award:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server-admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    console.log("[v0] GET /academy/badges - practiceId:", practiceId)

    const practiceIdInt =
      practiceId === "0" || !practiceId || practiceId === "undefined" ? 1 : Number.parseInt(practiceId)
    const supabase = createClient()

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("user_id")

    // If user_id is provided, get user's earned badges
    if (userId) {
      console.log("[v0] Fetching user badges for userId:", userId)
      const { data: badges, error } = await supabase
        .from("academy_user_badges")
        .select(`
          *,
          badge:academy_badges(*)
        `)
        .eq("user_id", userId)
        .order("earned_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching user badges:", error)
        if (error.message?.includes("Too Many") || error.code === "429") {
          return NextResponse.json([])
        }
        throw error
      }

      console.log("[v0] User badges fetched:", badges?.length)
      return NextResponse.json(badges || [])
    }

    // Otherwise, get all available badges for management
    console.log("[v0] Fetching all badges")
    const { data: badges, error } = await supabase
      .from("academy_badges")
      .select("*")
      .is("deleted_at", null)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching badges:", error)
      throw error
    }

    console.log("[v0] Badges fetched:", badges?.length)
    return NextResponse.json(badges || [])
  } catch (error: any) {
    console.error("[v0] GET /academy/badges error:", error)
    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    console.log("[v0] POST /academy/badges - practiceId:", practiceId)

    const supabase = createClient()
    const body = await request.json()
    console.log("[v0] Creating badge:", body)

    const badgeData = {
      name: body.name,
      description: body.description,
      badge_type: body.badge_type || body.badgeType || "achievement",
      icon_name: body.icon_name || body.iconName,
      icon_url: body.icon_url || body.iconUrl,
      icon: body.icon,
      color: body.color || "#3b82f6",
      criteria: body.criteria || {},
      criteria_type: body.criteria_type || body.criteriaType,
      criteria_value: body.criteria_value || body.criteriaValue,
      xp_reward: body.xp_reward || body.xpReward || 50,
      rarity: body.rarity || "common",
      is_active: body.is_active !== undefined ? body.is_active : body.isActive !== undefined ? body.isActive : true,
      display_order: body.display_order || body.displayOrder || body.sort_order || body.sortOrder || 0,
      category: body.category,
    }

    const { data: badge, error } = await supabase.from("academy_badges").insert(badgeData).select().single()

    if (error) {
      console.error("[v0] Error creating badge:", error)
      throw error
    }

    console.log("[v0] Badge created:", badge.id)
    return NextResponse.json(badge)
  } catch (error: any) {
    console.error("[v0] POST /academy/badges error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

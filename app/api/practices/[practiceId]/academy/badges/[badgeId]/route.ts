import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server-admin"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; badgeId: string }> },
) {
  try {
    const { practiceId, badgeId } = await params
    console.log("[v0] GET /academy/badges/[badgeId] - practiceId:", practiceId, "badgeId:", badgeId)

    const supabase = createClient()

    const { data: badge, error } = await supabase
      .from("academy_badges")
      .select("*")
      .eq("id", badgeId)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("[v0] Error fetching badge:", error)
      throw error
    }

    if (!badge) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 })
    }

    console.log("[v0] Badge fetched:", badge.id)
    return NextResponse.json(badge)
  } catch (error: any) {
    console.error("[v0] GET /academy/badges/[badgeId] error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; badgeId: string }> },
) {
  try {
    const { practiceId, badgeId } = await params
    console.log("[v0] PUT /academy/badges/[badgeId] - practiceId:", practiceId, "badgeId:", badgeId)

    const supabase = createClient()
    const body = await request.json()
    console.log("[v0] Updating badge:", badgeId)

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Map all possible fields
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.badge_type !== undefined) updateData.badge_type = body.badge_type
    if (body.badgeType !== undefined) updateData.badge_type = body.badgeType
    if (body.icon_name !== undefined) updateData.icon_name = body.icon_name
    if (body.iconName !== undefined) updateData.icon_name = body.iconName
    if (body.icon_url !== undefined) updateData.icon_url = body.icon_url
    if (body.iconUrl !== undefined) updateData.icon_url = body.iconUrl
    if (body.icon !== undefined) updateData.icon = body.icon
    if (body.color !== undefined) updateData.color = body.color
    if (body.criteria !== undefined) updateData.criteria = body.criteria
    if (body.criteria_type !== undefined) updateData.criteria_type = body.criteria_type
    if (body.criteriaType !== undefined) updateData.criteria_type = body.criteriaType
    if (body.criteria_value !== undefined) updateData.criteria_value = body.criteria_value
    if (body.criteriaValue !== undefined) updateData.criteria_value = body.criteriaValue
    if (body.xp_reward !== undefined) updateData.xp_reward = body.xp_reward
    if (body.xpReward !== undefined) updateData.xp_reward = body.xpReward
    if (body.rarity !== undefined) updateData.rarity = body.rarity
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.isActive !== undefined) updateData.is_active = body.isActive
    if (body.display_order !== undefined) updateData.display_order = body.display_order
    if (body.displayOrder !== undefined) updateData.display_order = body.displayOrder
    if (body.sort_order !== undefined) updateData.display_order = body.sort_order
    if (body.sortOrder !== undefined) updateData.display_order = body.sortOrder
    if (body.category !== undefined) updateData.category = body.category

    const { data: badge, error } = await supabase
      .from("academy_badges")
      .update(updateData)
      .eq("id", badgeId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating badge:", error)
      throw error
    }

    console.log("[v0] Badge updated:", badge.id)
    return NextResponse.json(badge)
  } catch (error: any) {
    console.error("[v0] PUT /academy/badges/[badgeId] error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; badgeId: string }> },
) {
  try {
    const { practiceId, badgeId } = await params
    console.log("[v0] DELETE /academy/badges/[badgeId] - practiceId:", practiceId, "badgeId:", badgeId)

    const supabase = createClient()

    const { data: badge, error } = await supabase
      .from("academy_badges")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", badgeId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error deleting badge:", error)
      throw error
    }

    console.log("[v0] Badge soft deleted:", badge.id)
    return NextResponse.json({ success: true, badge })
  } catch (error: any) {
    console.error("[v0] DELETE /academy/badges/[badgeId] error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

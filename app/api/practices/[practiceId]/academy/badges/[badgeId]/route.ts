import { type NextRequest, NextResponse } from "next/server"
import { getApiClient } from "@/lib/supabase/admin"

interface BadgeUpdateData {
  name?: string
  description?: string
  badge_type?: string
  icon_name?: string
  icon_url?: string
  icon?: string
  color?: string
  criteria?: string
  criteria_type?: string
  criteria_value?: number
  xp_reward?: number
  rarity?: string
  is_active?: boolean
  display_order?: number
  category?: string
  updated_at: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; badgeId: string }> },
) {
  try {
    const { badgeId } = await params

    const supabase = await getApiClient()

    const { data: badge, error } = await supabase
      .from("academy_badges")
      .select("*")
      .eq("id", badgeId)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("Error fetching badge:", error)
      throw error
    }

    if (!badge) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 })
    }

    return NextResponse.json(badge)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch badge"
    console.error("GET /academy/badges/[badgeId] error:", error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; badgeId: string }> },
) {
  try {
    const { badgeId } = await params

    const supabase = await getApiClient()
    const body = await request.json()

    const updateData: BadgeUpdateData = {
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
      console.error("Error updating badge:", error)
      throw error
    }

    return NextResponse.json(badge)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update badge"
    console.error("PUT /academy/badges/[badgeId] error:", error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; badgeId: string }> },
) {
  try {
    const { badgeId } = await params

    const supabase = await getApiClient()

    const { data: badge, error } = await supabase
      .from("academy_badges")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", badgeId)
      .select()
      .single()

    if (error) {
      console.error("Error deleting badge:", error)
      throw error
    }

    return NextResponse.json({ success: true, badge })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete badge"
    console.error("DELETE /academy/badges/[badgeId] error:", error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

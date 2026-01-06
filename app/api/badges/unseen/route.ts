import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Get unseen badges
    const { data: unseenBadges, error } = await supabase
      .from("academy_user_badges")
      .select(`
        *,
        badge:academy_badges(*)
      `)
      .eq("user_id", userId)
      .is("seen_at", null)
      .order("earned_at", { ascending: true })

    if (error) {
      console.error("Error fetching unseen badges:", error)
      return NextResponse.json([])
    }

    return NextResponse.json(unseenBadges || [])
  } catch (error) {
    console.error("Error in unseen badges:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()
    const { badgeIds } = body

    if (!badgeIds || !Array.isArray(badgeIds)) {
      return NextResponse.json({ error: "Missing badgeIds" }, { status: 400 })
    }

    // Mark badges as seen
    const { error } = await supabase
      .from("academy_user_badges")
      .update({ seen_at: new Date().toISOString() })
      .in("id", badgeIds)

    if (error) {
      console.error("Error marking badges as seen:", error)
      return NextResponse.json({ error: "Failed to mark badges as seen" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in mark seen:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

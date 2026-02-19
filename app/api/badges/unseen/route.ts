import { type NextRequest, NextResponse } from "next/server"
import { getApiClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getApiClient()
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Get recently earned badges (earned in the last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentBadges, error } = await supabase
      .from("academy_user_badges")
      .select(`
        *,
        badge:academy_badges(*)
      `)
      .eq("user_id", userId)
      .gte("earned_at", oneDayAgo)
      .order("earned_at", { ascending: true })

    if (error) {
      console.error("Error fetching unseen badges:", error)
      return NextResponse.json([])
    }

    return NextResponse.json(recentBadges || [])
  } catch (error) {
    console.error("Error in unseen badges:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  // No seen_at column exists, so this is a no-op that returns success
  return NextResponse.json({ success: true })
}

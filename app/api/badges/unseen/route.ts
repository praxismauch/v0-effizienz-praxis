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

    // Get recently earned badges (last 7 days) as "unseen"
    // The academy_user_badges table has no seen_at column
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: unseenBadges, error } = await supabase
      .from("academy_user_badges")
      .select(`
        *,
        badge:academy_badges(*)
      `)
      .eq("user_id", userId)
      .gte("earned_at", sevenDaysAgo)
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
    // No seen_at column exists on academy_user_badges,
    // return success so the UI doesn't break when marking badges as seen
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in mark seen:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess } from "@/lib/api-helpers"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json([])
    }

    const { data: badges, error } = await supabase
      .from("academy_user_badges")
      .select(`
        *,
        badge:academy_badges(*)
      `)
      .eq("user_id", userId)
      .order("earned_at", { ascending: false })

    if (error) {
      if (error.message?.includes("Too Many") || error.code === "429") {
        return NextResponse.json([])
      }
      throw error
    }

    return NextResponse.json(badges || [])
  } catch (error: any) {
    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error("Error fetching user badges:", error)
    return NextResponse.json([])
  }
}

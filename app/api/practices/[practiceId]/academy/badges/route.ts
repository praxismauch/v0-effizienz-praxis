import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()

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
    console.error("Error fetching user badges:", error)
    return NextResponse.json([])
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()

    const { data: leaderboard, error } = await supabase
      .from("academy_leaderboard")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("period", "weekly")
      .order("rank", { ascending: true })
      .limit(10)

    if (error) {
      if (error.message?.includes("Too Many") || error.code === "429") {
        return NextResponse.json([])
      }
      throw error
    }

    return NextResponse.json(leaderboard || [])
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json([])
  }
}

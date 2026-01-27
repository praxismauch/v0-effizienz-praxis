import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const { data: history, error } = await supabase
      .from("weekly_summary_history")
      .select("*")
      .eq("practice_id", practiceId)
      .order("sent_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching weekly summary history:", error)
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
    }

    return NextResponse.json({ history: history || [] })
  } catch (error) {
    console.error("Error in weekly summary history GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  const { practiceId } = await params
  const supabase = await createClient()

  try {
    const { data: analysis, error } = await supabase
      .from("workload_analysis")
      .select("*")
      .eq("practice_id", Number.parseInt(practiceId))
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") throw error

    return NextResponse.json({ analysis: analysis || null })
  } catch (error) {
    console.error("Error fetching workload analysis:", error)
    return NextResponse.json({ analysis: null })
  }
}

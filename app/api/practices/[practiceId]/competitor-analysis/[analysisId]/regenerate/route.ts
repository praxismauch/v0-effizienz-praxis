import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; analysisId: string }> },
) {
  try {
    const { practiceId, analysisId } = await params
    const supabase = await createClient()

    // Mark the analysis for regeneration
    const { error } = await supabase
      .from("competitor_analyses")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .eq("id", analysisId)
      .eq("practice_id", practiceId)

    if (error) throw error

    return NextResponse.json({ success: true, message: "Analyse wird neu generiert" })
  } catch (error) {
    console.error("Error regenerating analysis:", error)
    return NextResponse.json({ error: "Regenerierung fehlgeschlagen" }, { status: 500 })
  }
}

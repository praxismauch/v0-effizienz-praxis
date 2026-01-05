import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId || practiceId === "undefined" || practiceId === "null") {
      return NextResponse.json({ leitbild: null }, { status: 200 })
    }

    const supabase = await createAdminClient()

    // Fetch the active leitbild for this practice
    const { data: leitbild, error } = await supabase
      .from("leitbild")
      .select("id, mission_statement, vision_statement, leitbild_one_sentence, is_active")
      .eq("practice_id", practiceId)
      .eq("is_active", true)
      .maybeSingle()

    if (error) {
      console.error("[v0] Leitbild fetch error:", error)
      // Return empty leitbild instead of error to prevent UI issues
      return NextResponse.json({ leitbild: null }, { status: 200 })
    }

    return NextResponse.json({ leitbild })
  } catch (error) {
    console.error("[v0] Leitbild API error:", error)
    // Return empty leitbild instead of error to prevent UI issues
    return NextResponse.json({ leitbild: null }, { status: 200 })
  }
}

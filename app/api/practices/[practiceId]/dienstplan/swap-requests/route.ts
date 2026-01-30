import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const supabase = await createClient()

    let query = supabase
      .from("shift_swap_requests")
      .select(
        `
        *,
        requester:requester_id(id, first_name, last_name, avatar_url, role),
        target:target_id(id, first_name, last_name, avatar_url, role),
        requester_shift:requester_shift_id(id, shift_date, start_time, end_time, shift_type_id),
        target_shift:target_shift_id(id, shift_date, start_time, end_time, shift_type_id)
      `,
      )
      .eq("practice_id", practiceId)

    if (status) {
      query = query.eq("status", status)
    }

    const { data: swapRequests, error } = await query.order("created_at", { ascending: false })

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ swapRequests: [] })
      }
      throw error
    }

    return NextResponse.json({ swapRequests })
  } catch (error) {
    console.error("Error fetching swap requests:", error)
    return NextResponse.json({ swapRequests: [] })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const supabase = await createClient()

    // Generate AI recommendation
    let aiRecommendation = ""
    try {
      const { text } = await generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        prompt: `Analysiere diese Dienst-Tausch-Anfrage kurz (max. 2 Sätze):
        Begründung: ${body.reason}
        
        Gib eine kurze Empfehlung auf Deutsch, ob der Tausch sinnvoll erscheint.`,
      })
      aiRecommendation = text
    } catch (aiError) {
      console.error("AI recommendation failed:", aiError)
    }

    const { data: swapRequest, error } = await supabase
      .from("shift_swap_requests")
      .insert({
        practice_id: practiceId,
        requester_id: body.requester_id,
        target_id: body.target_id,
        requester_shift_id: body.requester_shift_id,
        target_shift_id: body.target_shift_id,
        reason: body.reason,
        status: "pending",
        ai_recommendation: aiRecommendation,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ swapRequest })
  } catch (error) {
    console.error("Error creating swap request:", error)
    return NextResponse.json({ error: "Failed to create swap request" }, { status: 500 })
  }
}

import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params
    const supabase = await createServerClient()

    // Get ratings for this practice
    const { data, error } = await supabase
      .from("google_ratings")
      .select("*")
      .eq("practice_id", practiceId)
      .order("review_date", { ascending: false })

    if (error) {
      console.error("[v0] Google Ratings API - Error:", error)
      return NextResponse.json({ error: "Failed to fetch Google ratings" }, { status: 500 })
    }

    return NextResponse.json({ ratings: data || [] })
  } catch (error) {
    console.error("[v0] Google Ratings API - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params
    const body = await request.json()
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("google_ratings")
      .insert({
        practice_id: practiceId,
        reviewer_name: body.reviewer_name,
        rating: body.rating,
        review_text: body.review_text,
        review_date: body.review_date,
        google_review_id: body.google_review_id,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Google Ratings API - Insert error:", error)
      return NextResponse.json({ error: "Failed to create Google rating" }, { status: 500 })
    }

    return NextResponse.json({ rating: data })
  } catch (error) {
    console.error("[v0] Google Ratings API - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

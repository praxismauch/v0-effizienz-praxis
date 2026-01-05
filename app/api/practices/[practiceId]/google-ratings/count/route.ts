import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createServerClient()

    const { data: ratings, error } = await supabase
      .from("google_ratings")
      .select("rating")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)

    if (error) {
      console.error("Error fetching Google ratings:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch ratings",
          count: 0,
          average: 0,
        },
        { status: 500 },
      )
    }

    if (!ratings || ratings.length === 0) {
      return NextResponse.json({
        count: 0,
        average: 0.0,
        message: "No Google reviews found for this practice",
      })
    }

    const count = ratings.length
    const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0)
    const average = sum / count

    return NextResponse.json({
      count,
      average: Number.parseFloat(average.toFixed(1)),
    })
  } catch (error) {
    console.error("Error fetching Google ratings:", error)
    return NextResponse.json({ error: "Failed to fetch ratings", count: 0, average: 0 }, { status: 500 })
  }
}

import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Fetch all reviews from all platforms in parallel with error handling
    const [googleResult, jamedaResult, sanegoResult] = await Promise.all([
      supabase
        .from("google_ratings")
        .select("*")
        .eq("practice_id", String(practiceId))
        .is("deleted_at", null)
        .order("review_date", { ascending: false })
        .then((res) => {
          // Handle table not existing (42P01 error code)
          if (res.error?.code === "42P01") {
            return { data: [], error: null }
          }
          return res
        }),
      supabase
        .from("jameda_ratings")
        .select("*")
        .eq("practice_id", String(practiceId))
        .is("deleted_at", null)
        .order("review_date", { ascending: false })
        .then((res) => {
          if (res.error?.code === "42P01") {
            return { data: [], error: null }
          }
          return res
        }),
      supabase
        .from("sanego_ratings")
        .select("*")
        .eq("practice_id", String(practiceId))
        .is("deleted_at", null)
        .order("review_date", { ascending: false })
        .then((res) => {
          if (res.error?.code === "42P01") {
            return { data: [], error: null }
          }
          return res
        }),
    ])

    // Log errors for debugging
    if (googleResult.error) console.error("[v0] Google ratings error:", googleResult.error)
    if (jamedaResult.error) console.error("[v0] Jameda ratings error:", jamedaResult.error)
    if (sanegoResult.error) console.error("[v0] Sanego ratings error:", sanegoResult.error)

    // Calculate statistics
    const googleReviews = googleResult.data || []
    const jamedaReviews = jamedaResult.data || []
    const sanegoReviews = sanegoResult.data || []

    const calculateStats = (reviews: any[]) => {
      if (reviews.length === 0) return { count: 0, average: 0, distribution: [0, 0, 0, 0, 0] }
      const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0)
      const distribution = [0, 0, 0, 0, 0]
      reviews.forEach((r) => {
        if (r.rating >= 1 && r.rating <= 5) {
          distribution[r.rating - 1]++
        }
      })
      return {
        count: reviews.length,
        average: total / reviews.length,
        distribution,
      }
    }

    return NextResponse.json({
      google: {
        reviews: googleReviews,
        stats: calculateStats(googleReviews),
      },
      jameda: {
        reviews: jamedaReviews,
        stats: calculateStats(jamedaReviews),
      },
      sanego: {
        reviews: sanegoReviews,
        stats: calculateStats(sanegoReviews),
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching reviews:", error)
    return NextResponse.json({
      google: { reviews: [], stats: { count: 0, average: 0, distribution: [0, 0, 0, 0, 0] } },
      jameda: { reviews: [], stats: { count: 0, average: 0, distribution: [0, 0, 0, 0, 0] } },
      sanego: { reviews: [], stats: { count: 0, average: 0, distribution: [0, 0, 0, 0, 0] } },
    })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const { platform, review } = body

    if (!practiceId || !platform || !review) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    let tableName = ""
    switch (platform) {
      case "google":
        tableName = "google_ratings"
        break
      case "jameda":
        tableName = "jameda_ratings"
        break
      case "sanego":
        tableName = "sanego_ratings"
        break
      default:
        return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert({
        ...review,
        practice_id: practiceId,
      })
      .select()
      .single()

    if (error) {
      console.error("Error inserting review:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}

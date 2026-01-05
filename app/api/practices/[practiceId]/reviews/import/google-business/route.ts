import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Google Business Profile API endpoints
const GOOGLE_API_BASE = "https://mybusiness.googleapis.com/v4"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const { accessToken, accountId, locationId } = body

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    if (!accessToken || !accountId || !locationId) {
      return NextResponse.json(
        {
          error: "Google Business Profile credentials required (accessToken, accountId, locationId)",
        },
        { status: 400 },
      )
    }

    const supabase = await createAdminClient()

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from("review_imports")
      .insert({
        practice_id: practiceId,
        platform: "google",
        import_type: "google_api",
        status: "processing",
      })
      .select()
      .single()

    if (importError) {
      console.error("Error creating import record:", importError)
      return NextResponse.json({ error: "Failed to create import record" }, { status: 500 })
    }

    try {
      // Fetch reviews from Google Business Profile API
      const reviewsUrl = `${GOOGLE_API_BASE}/accounts/${accountId}/locations/${locationId}/reviews`

      const response = await fetch(reviewsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch((parseError) => {
          console.error("[v0] Failed to parse Google API error response:", parseError)
          return {}
        })
        throw new Error(errorData.error?.message || `Google API error: ${response.status}`)
      }

      const data = await response.json()
      const reviews = data.reviews || []

      let importedCount = 0
      let skippedCount = 0

      for (const review of reviews) {
        // Extract review ID from name (format: accounts/xxx/locations/xxx/reviews/xxx)
        const reviewId = review.name?.split("/").pop() || `google_${Date.now()}_${importedCount}`

        // Check if already exists
        const { data: existing } = await supabase
          .from("google_ratings")
          .select("id")
          .eq("practice_id", practiceId)
          .eq("google_review_id", reviewId)
          .single()

        if (existing) {
          skippedCount++
          continue
        }

        // Convert Google star rating to number
        const ratingMap: Record<string, number> = {
          ONE: 1,
          TWO: 2,
          THREE: 3,
          FOUR: 4,
          FIVE: 5,
        }

        const reviewData = {
          practice_id: practiceId,
          google_review_id: reviewId,
          reviewer_name: review.reviewer?.displayName || "Google User",
          rating: ratingMap[review.starRating] || 5,
          review_text: review.comment || "",
          review_date: review.createTime
            ? new Date(review.createTime).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          response_text: review.reviewReply?.comment || null,
          response_date: review.reviewReply?.updateTime
            ? new Date(review.reviewReply.updateTime).toISOString().split("T")[0]
            : null,
        }

        const { error: insertError } = await supabase.from("google_ratings").insert(reviewData)

        if (!insertError) {
          importedCount++
        }
      }

      // Update import record
      await supabase
        .from("review_imports")
        .update({
          status: "completed",
          total_reviews: reviews.length,
          imported_reviews: importedCount,
          skipped_reviews: skippedCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", importRecord.id)

      // Update platform config
      await supabase.from("review_platform_config").upsert({
        practice_id: practiceId,
        platform: "google",
        last_sync_at: new Date().toISOString(),
        last_sync_count: importedCount,
        is_active: true,
        config: { accountId, locationId },
      })

      return NextResponse.json({
        success: true,
        importId: importRecord.id,
        totalFound: reviews.length,
        imported: importedCount,
        skipped: skippedCount,
      })
    } catch (apiError: any) {
      // Update import record with error
      await supabase
        .from("review_imports")
        .update({
          status: "failed",
          error_message: apiError.message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", importRecord.id)

      throw apiError
    }
  } catch (error: any) {
    console.error("Error importing Google reviews:", error)
    return NextResponse.json({ error: error.message || "Failed to import reviews" }, { status: 500 })
  }
}

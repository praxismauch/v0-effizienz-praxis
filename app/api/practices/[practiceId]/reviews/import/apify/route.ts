import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

// Apify Jameda Scraper Actor ID
const JAMEDA_SCRAPER_ACTOR_ID = "muhammet_akkurt/jameda-reviews-scraper"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const { apifyApiKey, doctorUrl, doctorName, city, specialty } = body

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    if (!apifyApiKey) {
      return NextResponse.json({ error: "Apify API key required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from("review_imports")
      .insert({
        practice_id: practiceId,
        platform: "jameda",
        import_type: "apify",
        status: "processing",
      })
      .select()
      .single()

    if (importError) {
      console.error("Error creating import record:", importError)
      return NextResponse.json({ error: "Failed to create import record" }, { status: 500 })
    }

    try {
      // Prepare Apify Actor input
      const actorInput = {
        doctorUrls: doctorUrl ? [doctorUrl] : [],
        searchByDoctor: !doctorUrl,
        doctorName: doctorName || "",
        city: city || "",
        specialty: specialty || "",
        maxReviews: 100,
      }

      // Call Apify API to run the actor
      const apifyResponse = await fetch(
        `https://api.apify.com/v2/acts/${JAMEDA_SCRAPER_ACTOR_ID}/runs?token=${apifyApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(actorInput),
        },
      )

      if (!apifyResponse.ok) {
        const errorText = await apifyResponse.text()
        throw new Error(`Apify API error: ${errorText}`)
      }

      const runData = await apifyResponse.json()
      const runId = runData.data?.id

      if (!runId) {
        throw new Error("Failed to start Apify actor run")
      }

      // Poll for results (with timeout)
      let attempts = 0
      const maxAttempts = 30
      let results: any[] = []

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000))

        const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyApiKey}`)
        const statusData = await statusResponse.json()

        if (statusData.data?.status === "SUCCEEDED") {
          // Get results from dataset
          const datasetId = statusData.data?.defaultDatasetId
          const resultsResponse = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyApiKey}`,
          )
          results = await resultsResponse.json()
          break
        } else if (statusData.data?.status === "FAILED" || statusData.data?.status === "ABORTED") {
          throw new Error(`Apify actor run failed: ${statusData.data?.status}`)
        }

        attempts++
      }

      if (attempts >= maxAttempts) {
        // Update import record with timeout
        await supabase
          .from("review_imports")
          .update({
            status: "failed",
            error_message: "Timeout waiting for Apify results",
            updated_at: new Date().toISOString(),
          })
          .eq("id", importRecord.id)

        return NextResponse.json(
          {
            error: "Timeout waiting for results. The scraper is still running - check back later.",
            runId,
          },
          { status: 408 },
        )
      }

      // Process and insert reviews
      let importedCount = 0
      let skippedCount = 0

      for (const review of results) {
        // Check if review already exists
        const { data: existing } = await supabase
          .from("jameda_ratings")
          .select("id")
          .eq("practice_id", practiceId)
          .eq("jameda_review_id", review.reviewId || review.id)
          .single()

        if (existing) {
          skippedCount++
          continue
        }

        // Insert new review
        const { error: insertError } = await supabase.from("jameda_ratings").insert({
          practice_id: practiceId,
          jameda_review_id: review.reviewId || review.id || `apify_${Date.now()}_${importedCount}`,
          reviewer_name: review.authorName || review.reviewer || "Anonym",
          rating: review.rating || review.score || 5,
          review_text: review.reviewText || review.text || review.comment || "",
          review_date: review.date
            ? new Date(review.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          category: review.category || "Allgemein",
        })

        if (!insertError) {
          importedCount++
        }
      }

      // Update import record
      await supabase
        .from("review_imports")
        .update({
          status: "completed",
          total_reviews: results.length,
          imported_reviews: importedCount,
          skipped_reviews: skippedCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", importRecord.id)

      // Update platform config with last sync
      await supabase.from("review_platform_config").upsert({
        practice_id: practiceId,
        platform: "jameda",
        last_sync_at: new Date().toISOString(),
        last_sync_count: importedCount,
        is_active: true,
      })

      return NextResponse.json({
        success: true,
        importId: importRecord.id,
        totalFound: results.length,
        imported: importedCount,
        skipped: skippedCount,
      })
    } catch (scrapeError: any) {
      // Update import record with error
      await supabase
        .from("review_imports")
        .update({
          status: "failed",
          error_message: scrapeError.message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", importRecord.id)

      throw scrapeError
    }
  } catch (error: any) {
    console.error("Error importing Jameda reviews:", error)
    return NextResponse.json({ error: error.message || "Failed to import reviews" }, { status: 500 })
  }
}

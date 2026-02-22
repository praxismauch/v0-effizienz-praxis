import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Uses Google Places API (New) - only requires API Key + Place ID (no OAuth needed)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> },
) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const supabase = createAdminClient()

    // Get saved settings or use provided values
    const { data: integration } = await supabase
      .from("practice_integrations")
      .select("settings")
      .eq("practice_id", practiceId)
      .eq("provider", "google_business")
      .maybeSingle()

    const savedSettings = integration?.settings || {}
    const apiKey = body.apiKey || savedSettings.api_key
    const placeId = body.placeId || savedSettings.place_id

    if (!apiKey || !placeId) {
      return NextResponse.json(
        { error: "Google API Key und Place ID sind erforderlich. Bitte in den Einstellungen konfigurieren." },
        { status: 400 },
      )
    }

    // Fetch place details including reviews via Google Places API (New)
    const placesUrl = `https://places.googleapis.com/v1/places/${placeId}?languageCode=de&key=${apiKey}`

    const placesResponse = await fetch(placesUrl, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "reviews,rating,userRatingCount,displayName",
      },
    })

    if (!placesResponse.ok) {
      const errorData = await placesResponse.json().catch(() => ({}))
      console.error("[v0] Google Places API error:", errorData)

      if (placesResponse.status === 403 || placesResponse.status === 400) {
        return NextResponse.json(
          { error: "API Key ungueltig oder Places API nicht aktiviert. Bitte aktivieren Sie die 'Places API (New)' in der Google Cloud Console." },
          { status: 403 },
        )
      }

      return NextResponse.json(
        { error: `Google API Fehler: ${errorData.error?.message || "Unbekannter Fehler"}` },
        { status: placesResponse.status },
      )
    }

    const placesData = await placesResponse.json()
    const reviews = placesData.reviews || []

    if (reviews.length === 0) {
      await updateSyncStatus(supabase, practiceId, savedSettings, placesData, "success")
      return NextResponse.json({
        success: true,
        imported: 0,
        skipped: 0,
        total: 0,
        message: "Keine neuen Bewertungen gefunden.",
      })
    }

    // Get existing reviews to avoid duplicates
    const { data: existingReviews } = await supabase
      .from("google_ratings")
      .select("google_review_id, reviewer_name, review_date")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)

    const existingIds = new Set(
      (existingReviews || []).map((r) => r.google_review_id).filter(Boolean),
    )
    const existingKeys = new Set(
      (existingReviews || []).map((r) => `${r.reviewer_name}_${r.review_date}`),
    )

    let imported = 0
    let skipped = 0

    const ratingMap: Record<string, number> = {
      ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
    }

    for (const review of reviews) {
      const reviewId = review.name || null
      const reviewerName = review.authorAttribution?.displayName || "Anonym"
      const reviewDate = review.publishTime
        ? new Date(review.publishTime).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0]
      const reviewKey = `${reviewerName}_${reviewDate}`

      // Skip duplicates
      if ((reviewId && existingIds.has(reviewId)) || existingKeys.has(reviewKey)) {
        skipped++
        continue
      }

      const { error: insertError } = await supabase.from("google_ratings").insert({
        practice_id: practiceId,
        google_review_id: reviewId,
        reviewer_name: reviewerName,
        reviewer_photo_url: review.authorAttribution?.photoUri || null,
        rating: ratingMap[review.rating] || 5,
        review_text: review.text?.text || review.originalText?.text || "",
        review_date: reviewDate,
        review_language: review.originalText?.languageCode || "de",
        source: "google_places_api",
      })

      if (insertError) {
        console.error("[v0] Error inserting review:", insertError)
        skipped++
      } else {
        imported++
      }
    }

    await updateSyncStatus(supabase, practiceId, savedSettings, placesData, "success")

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: reviews.length,
      averageRating: placesData.rating,
      totalReviews: placesData.userRatingCount,
    })
  } catch (error: any) {
    console.error("[v0] Error importing Google reviews:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Importieren der Bewertungen" },
      { status: 500 },
    )
  }
}

async function updateSyncStatus(
  supabase: any,
  practiceId: string,
  savedSettings: any,
  placesData: any,
  status: string,
) {
  await supabase
    .from("practice_integrations")
    .upsert({
      practice_id: practiceId,
      provider: "google_business",
      is_active: true,
      settings: {
        ...savedSettings,
        last_sync_at: new Date().toISOString(),
        last_sync_status: status,
        location_name: placesData.displayName?.text || savedSettings.location_name,
        average_rating: placesData.rating || null,
        total_reviews: placesData.userRatingCount || 0,
      },
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "practice_id,provider" })
}

import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Google Places API (new) endpoint
const GOOGLE_PLACES_API_URL = "https://places.googleapis.com/v1/places"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId || practiceId === "0" || practiceId === "undefined") {
      return NextResponse.json({ error: "Invalid practice ID" }, { status: 400 })
    }

    const adminClient = await createAdminClient()
    if (!adminClient) {
      return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
    }

    // Get practice settings with Google Place ID
    const { data: practice, error: practiceError } = await adminClient
      .from("practices")
      .select("id, name, settings")
      .eq("id", practiceId)
      .single()

    if (practiceError || !practice) {
      console.error("[v0] Failed to fetch practice:", practiceError)
      return NextResponse.json({ error: "Practice not found" }, { status: 404 })
    }

    const placeId = practice.settings?.googlePlaceId
    if (!placeId) {
      return NextResponse.json(
        {
          error: "Google Place ID not configured",
          message: "Bitte konfigurieren Sie zuerst Ihre Google Place ID in den Einstellungen.",
        },
        { status: 400 },
      )
    }

    let apiKey = process.env.GOOGLE_PLACES_API_KEY
    console.log("[v0] GOOGLE_PLACES_API_KEY from env:", apiKey ? `Set (${apiKey.substring(0, 8)}...)` : "Not set")

    // Try to get practice-specific API key from practice_settings using admin client
    const { data: practiceSettingsData, error: settingsError } = await adminClient
      .from("practice_settings")
      .select("system_settings")
      .eq("practice_id", practiceId)
      .single()

    if (settingsError) {
      console.log("[v0] practice_settings query error (may not exist):", settingsError.message)
    }

    const practiceApiKey = practiceSettingsData?.system_settings?.google_places_api_key
    if (practiceApiKey && practiceApiKey.trim().length > 10) {
      apiKey = practiceApiKey.trim()
      console.log("[v0] Using practice-specific API key")
    }

    if (!apiKey) {
      // Fallback: Return data from local database if no API key
      console.warn("[v0] No Google Places API key configured (neither env nor practice_settings)")

      const { data: localRatings, error: localError } = await adminClient
        .from("google_ratings")
        .select("*")
        .eq("practice_id", practiceId)
        .is("deleted_at", null)
        .order("review_date", { ascending: false })
        .limit(10)

      if (localError) {
        console.error("[v0] Error fetching local ratings:", localError)
        return NextResponse.json({
          reviews: [],
          totalReviews: 0,
          averageRating: 0,
          source: "local",
          message: "Google Places API nicht konfiguriert. Fügen Sie GOOGLE_PLACES_API_KEY als Umgebungsvariable hinzu.",
        })
      }

      const count = localRatings?.length || 0
      const sum = localRatings?.reduce((acc, r) => acc + (r.rating || 0), 0) || 0
      const average = count > 0 ? sum / count : 0

      return NextResponse.json({
        reviews: localRatings || [],
        totalReviews: count,
        averageRating: Number.parseFloat(average.toFixed(1)),
        source: "local",
        placeId,
        message:
          count === 0
            ? "Keine lokalen Bewertungen gefunden. Nutzen Sie die Import-Funktion um Bewertungen hinzuzufügen oder konfigurieren Sie GOOGLE_PLACES_API_KEY."
            : undefined,
      })
    }

    // Fetch from Google Places API (new)
    console.log("[v0] Fetching from Google Places API for placeId:", placeId)
    try {
      const response = await fetch(`${GOOGLE_PLACES_API_URL}/${placeId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "id,displayName,rating,userRatingCount,reviews",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Google Places API error:", response.status, errorText)

        // Fallback to local data
        const { data: localRatings } = await adminClient
          .from("google_ratings")
          .select("*")
          .eq("practice_id", practiceId)
          .is("deleted_at", null)
          .order("review_date", { ascending: false })
          .limit(10)

        const count = localRatings?.length || 0
        const sum = localRatings?.reduce((acc, r) => acc + (r.rating || 0), 0) || 0
        const average = count > 0 ? sum / count : 0

        return NextResponse.json({
          reviews: localRatings || [],
          totalReviews: count,
          averageRating: Number.parseFloat(average.toFixed(1)),
          source: "local",
          error: `Google API error: ${response.status}`,
          placeId,
        })
      }

      const placeData = await response.json()
      console.log("[v0] Google Places API response:", {
        rating: placeData.rating,
        reviewCount: placeData.userRatingCount,
        reviewsReturned: placeData.reviews?.length || 0,
      })

      // Store/update reviews in database
      if (placeData.reviews && placeData.reviews.length > 0) {
        for (const review of placeData.reviews) {
          const reviewId = review.name?.split("/").pop() || `google_${Date.now()}`

          const reviewData = {
            practice_id: practiceId,
            google_review_id: reviewId,
            reviewer_name: review.authorAttribution?.displayName || "Google User",
            rating: review.rating || 5,
            review_text: review.text?.text || review.originalText?.text || "",
            review_date: review.publishTime
              ? new Date(review.publishTime).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            profile_photo_url: review.authorAttribution?.photoUri || null,
          }

          // Upsert to avoid duplicates
          await adminClient.from("google_ratings").upsert(reviewData, { onConflict: "practice_id,google_review_id" })
        }
      }

      return NextResponse.json({
        reviews: placeData.reviews || [],
        totalReviews: placeData.userRatingCount || 0,
        averageRating: placeData.rating || 0,
        placeName: placeData.displayName?.text || practice.name,
        source: "google_api",
        placeId,
      })
    } catch (apiError: any) {
      console.error("[v0] Google Places API fetch error:", apiError)

      // Fallback to local data
      const { data: localRatings } = await adminClient
        .from("google_ratings")
        .select("*")
        .eq("practice_id", practiceId)
        .is("deleted_at", null)
        .order("review_date", { ascending: false })
        .limit(10)

      const count = localRatings?.length || 0
      const sum = localRatings?.reduce((acc, r) => acc + (r.rating || 0), 0) || 0
      const average = count > 0 ? sum / count : 0

      return NextResponse.json({
        reviews: localRatings || [],
        totalReviews: count,
        averageRating: Number.parseFloat(average.toFixed(1)),
        source: "local",
        error: apiError.message,
        placeId,
      })
    }
  } catch (error: any) {
    console.error("[v0] Error in google-reviews/fetch:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch reviews",
        reviews: [],
        totalReviews: 0,
        averageRating: 0,
      },
      { status: 500 },
    )
  }
}

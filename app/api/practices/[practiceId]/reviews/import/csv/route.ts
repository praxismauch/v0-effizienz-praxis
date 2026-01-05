import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const { platform, reviews, fileName } = body

    if (!practiceId || !platform || !reviews || !Array.isArray(reviews)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from("review_imports")
      .insert({
        practice_id: practiceId,
        platform,
        import_type: "csv",
        status: "processing",
        file_name: fileName || "csv_import",
        total_reviews: reviews.length,
      })
      .select()
      .single()

    if (importError) {
      console.error("Error creating import record:", importError)
      return NextResponse.json({ error: "Failed to create import record" }, { status: 500 })
    }

    // Determine table name
    let tableName = ""
    let idField = ""
    switch (platform) {
      case "google":
        tableName = "google_ratings"
        idField = "google_review_id"
        break
      case "jameda":
        tableName = "jameda_ratings"
        idField = "jameda_review_id"
        break
      case "sanego":
        tableName = "sanego_ratings"
        idField = "sanego_review_id"
        break
      default:
        return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
    }

    let importedCount = 0
    let skippedCount = 0

    for (const review of reviews) {
      // Generate unique ID if not provided
      const reviewId = review.id || review.review_id || `csv_${Date.now()}_${importedCount}`

      // Check if already exists
      const { data: existing } = await supabase
        .from(tableName)
        .select("id")
        .eq("practice_id", practiceId)
        .eq(idField, reviewId)
        .single()

      if (existing) {
        skippedCount++
        continue
      }

      // Prepare review data
      const reviewData: any = {
        practice_id: practiceId,
        [idField]: reviewId,
        reviewer_name: review.reviewer_name || review.author || review.name || "Anonym",
        rating: Number.parseInt(review.rating) || 5,
        review_text: review.review_text || review.text || review.comment || "",
        review_date: review.review_date || review.date || new Date().toISOString().split("T")[0],
      }

      // Add response if provided
      if (review.response_text || review.response) {
        reviewData.response_text = review.response_text || review.response
        reviewData.response_date = review.response_date || new Date().toISOString().split("T")[0]
      }

      // Platform specific fields
      if (platform === "jameda") {
        reviewData.category = review.category || "Allgemein"
      }
      if (platform === "sanego") {
        reviewData.recommendation_score = review.recommendation_score || review.recommendation
      }

      const { error: insertError } = await supabase.from(tableName).insert(reviewData)

      if (!insertError) {
        importedCount++
      }
    }

    // Update import record
    await supabase
      .from("review_imports")
      .update({
        status: "completed",
        imported_reviews: importedCount,
        skipped_reviews: skippedCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", importRecord.id)

    return NextResponse.json({
      success: true,
      importId: importRecord.id,
      total: reviews.length,
      imported: importedCount,
      skipped: skippedCount,
    })
  } catch (error: any) {
    console.error("Error importing CSV reviews:", error)
    return NextResponse.json({ error: error.message || "Failed to import reviews" }, { status: 500 })
  }
}

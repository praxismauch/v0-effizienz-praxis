import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export const maxDuration = 60

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const { platform, imageUrl, textContent, fileName } = body

    if (!practiceId || !platform) {
      return NextResponse.json({ error: "Practice ID and platform required" }, { status: 400 })
    }

    if (!imageUrl && !textContent) {
      return NextResponse.json({ error: "Either imageUrl or textContent required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from("review_imports")
      .insert({
        practice_id: practiceId,
        platform,
        import_type: "ai_extraction",
        status: "processing",
        file_name: fileName || "ai_extraction",
        file_url: imageUrl,
      })
      .select()
      .single()

    if (importError) {
      console.error("Error creating import record:", importError)
      return NextResponse.json({ error: "Failed to create import record" }, { status: 500 })
    }

    try {
      // Build prompt for AI extraction
      const extractionPrompt = `
Du bist ein Experte für die Extraktion von Bewertungsdaten. Analysiere den folgenden Inhalt und extrahiere alle Bewertungen im JSON-Format.

${textContent ? `Text-Inhalt:\n${textContent}` : `Analysiere das Bild und extrahiere die Bewertungen.`}

Extrahiere jede Bewertung mit folgenden Feldern:
- reviewer_name: Name des Bewertenden (oder "Anonym" wenn nicht vorhanden)
- rating: Bewertung als Zahl von 1-5 (oder 1-6 für Jameda)
- review_text: Der vollständige Bewertungstext
- review_date: Datum der Bewertung im Format YYYY-MM-DD (schätze wenn nicht vorhanden)
- category: Kategorie der Bewertung (falls vorhanden)

Antworte NUR mit einem validen JSON-Array der extrahierten Bewertungen. Beispiel:
[
  {
    "reviewer_name": "Max Mustermann",
    "rating": 5,
    "review_text": "Sehr zufrieden mit der Behandlung...",
    "review_date": "2024-01-15",
    "category": "Behandlung"
  }
]

Wenn keine Bewertungen gefunden werden, antworte mit einem leeren Array: []
`

      let result
      if (imageUrl) {
        // Use vision model for image analysis
        result = await generateText({
          model: "anthropic/claude-sonnet-4-20250514",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: extractionPrompt },
                { type: "image", image: imageUrl },
              ],
            },
          ],
        })
      } else {
        result = await generateText({
          model: "anthropic/claude-sonnet-4-20250514",
          prompt: extractionPrompt,
        })
      }

      // Parse AI response
      let extractedReviews: any[] = []
      try {
        // Extract JSON from response
        const jsonMatch = result.text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          extractedReviews = JSON.parse(jsonMatch[0])
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError)
        throw new Error("Could not parse extracted reviews")
      }

      // Determine table and ID field
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
          throw new Error("Invalid platform")
      }

      let importedCount = 0
      let skippedCount = 0

      for (const review of extractedReviews) {
        const reviewId = `ai_${Date.now()}_${importedCount}`

        const reviewData: any = {
          practice_id: practiceId,
          [idField]: reviewId,
          reviewer_name: review.reviewer_name || "Anonym",
          rating: Math.min(Math.max(Number.parseInt(review.rating) || 5, 1), platform === "jameda" ? 6 : 5),
          review_text: review.review_text || "",
          review_date: review.review_date || new Date().toISOString().split("T")[0],
        }

        if (platform === "jameda") {
          reviewData.category = review.category || "Allgemein"
        }

        const { error: insertError } = await supabase.from(tableName).insert(reviewData)

        if (!insertError) {
          importedCount++
        } else {
          skippedCount++
        }
      }

      // Update import record
      await supabase
        .from("review_imports")
        .update({
          status: "completed",
          total_reviews: extractedReviews.length,
          imported_reviews: importedCount,
          skipped_reviews: skippedCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", importRecord.id)

      return NextResponse.json({
        success: true,
        importId: importRecord.id,
        totalExtracted: extractedReviews.length,
        imported: importedCount,
        skipped: skippedCount,
        extractedReviews,
      })
    } catch (aiError: any) {
      // Update import record with error
      await supabase
        .from("review_imports")
        .update({
          status: "failed",
          error_message: aiError.message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", importRecord.id)

      throw aiError
    }
  } catch (error: any) {
    console.error("Error extracting reviews with AI:", error)
    return NextResponse.json({ error: error.message || "Failed to extract reviews" }, { status: 500 })
  }
}

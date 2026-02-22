import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, practice_id, created_by } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Kein Bild-URL angegeben" }, { status: 400 })
    }

    // DSGVO: Business card OCR - data is processed transiently for structured extraction only.
    // Extracted data is stored only in the practice's own database.
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "DATENSCHUTZHINWEIS: Diese Daten werden ausschließlich zur einmaligen Strukturierung verwendet.\n\nExtrahiere alle Kontaktinformationen von dieser Visitenkarte im JSON-Format. Gib folgende Felder zurück: salutation, title, first_name, last_name, company, position, email, phone, mobile, fax, website, street, house_number, postal_code, city, country. Wenn ein Feld nicht vorhanden ist, gib null zurück. Gib nur das JSON zurück, keine zusätzlichen Erklärungen.",
            },
            {
              type: "image",
              image: new URL(imageUrl),
            },
          ],
        },
      ],
    })

    // Parse the AI response - handle markdown code blocks
    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const extractedData = JSON.parse(cleanedText)

    // Calculate confidence (simplified)
    const filledFields = Object.values(extractedData).filter((v) => v !== null).length
    const totalFields = Object.keys(extractedData).length
    const confidence = filledFields / totalFields

    // Save to database
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        ...extractedData,
        practice_id,
        created_by,
        image_url: imageUrl,
        ai_extracted: true,
        ai_confidence: confidence,
        ai_metadata: {
          extracted_at: new Date().toISOString(),
          model: "claude-sonnet-4",
        },
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      contact: data,
      confidence,
    })
  } catch (error: any) {
    console.error("AI extraction error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const supabase = await createClient()
    const { practiceId } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[v0] Smart upload - No authenticated user")
      return NextResponse.json({ error: "Authentifizierung erforderlich" }, { status: 401 })
    }

    const userId = user.id

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Keine Dateien hochgeladen" }, { status: 400 })
    }

    const results = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
        const validDocTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]
        const isImage = validImageTypes.includes(file.type)
        const isDoc = validDocTypes.includes(file.type)

        if (!isImage && !isDoc) {
          results.push({
            success: false,
            filename: file.name,
            error: `Ungültiger Dateityp: ${file.type}. Unterstützt werden: Bilder (JPEG, PNG, GIF, WebP), PDFs und DOC-Dateien.`,
          })
          continue
        }

        const blob = await put(`kv-abrechnung/${practiceId}/smart-upload-${Date.now()}-${file.name}`, file, {
          access: "public",
        })

        if (!isImage) {
          results.push({
            success: false,
            filename: file.name,
            error:
              "PDF- und DOC-Dateien werden hochgeladen, aber automatische Erkennung ist nur für Bilder verfügbar. Bitte ordnen Sie die Datei manuell zu.",
            blob_url: blob.url,
            needs_manual_selection: true,
            year: new Date().getFullYear(), // Provide current year as default
          })
          continue
        }

        const { text } = await generateText({
          model: "anthropic/claude-sonnet-4-20250514",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analysiere diese KV Abrechnung und extrahiere folgende Informationen:
                  1. Jahr und Quartal
                  2. Alle sichtbaren Abrechnungsdaten wie Honorar, Fallzahlen, Positionen, etc.
                  
                  Antworte NUR mit einem JSON-Objekt in diesem Format:
                  {
                    "year": 2024,
                    "quarter": 1,
                    "extracted_data": {
                      "honorar": "Betrag wenn sichtbar",
                      "fallzahlen": "Anzahl wenn sichtbar",
                      "weitere_daten": "alle anderen sichtbaren Informationen"
                    }
                  }
                  
                  Falls du Jahr oder Quartal nicht eindeutig erkennen kannst, gib null zurück.
                  Für extracted_data: extrahiere alle sichtbaren Informationen aus dem Dokument.`,
                },
                {
                  type: "image",
                  image: blob.url,
                },
              ],
            },
          ],
        })

        let cleanedText = text.trim()
        // Remove markdown code fences
        if (cleanedText.startsWith("`")) {
          cleanedText = cleanedText
            .replace(/^```(?:json)?\s*\n?/i, "")
            .replace(/\n?```\s*$/i, "")
            .trim()
        }

        // Parse AI response
        let detectedData
        try {
          detectedData = JSON.parse(cleanedText)
        } catch (parseError) {
          console.error(`[v0] Smart upload - Failed to parse AI response:`, parseError)
          console.error(`[v0] Smart upload - Cleaned text was:`, cleanedText)
          throw new Error("KI konnte Jahr/Quartal nicht erkennen")
        }

        const { year, quarter, extracted_data } = detectedData

        if (!year || year < 2000 || year > 2100) {
          throw new Error("Ungültiges Jahr erkannt")
        }

        if (!quarter || quarter < 1 || quarter > 4) {
          results.push({
            success: false,
            filename: file.name,
            year,
            quarter: null,
            blob_url: blob.url,
            needs_manual_selection: true,
            error: "Quartal konnte nicht erkannt werden. Bitte wählen Sie es manuell aus.",
          })
          continue
        }

        const { data: existing, error: selectError } = await supabase
          .from("kv_abrechnung")
          .select("id")
          .eq("practice_id", practiceId)
          .eq("year", year)
          .eq("quarter", quarter)
          .maybeSingle()

        if (selectError) {
          console.error(`[v0] Smart upload - Error checking for existing record:`, selectError)
          throw selectError
        }

        if (existing) {
          const { data, error } = await supabase
            .from("kv_abrechnung")
            .update({
              image_url: blob.url,
              extracted_data: extracted_data || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
            .select()
            .single()

          if (error) {
            console.error(`[v0] Smart upload - Supabase update error:`, error)
            throw error
          }

          results.push({
            success: true,
            filename: file.name,
            year,
            quarter,
            action: "updated",
            data,
          })
        } else {
          const { data, error } = await supabase
            .from("kv_abrechnung")
            .insert({
              practice_id: practiceId,
              year,
              quarter,
              image_url: blob.url,
              extracted_data: extracted_data || null,
              created_by: userId,
            })
            .select()
            .single()

          if (error) {
            console.error(`[v0] Smart upload - Supabase insert error:`, error)
            throw error
          }

          results.push({
            success: true,
            filename: file.name,
            year,
            quarter,
            action: "created",
            data,
          })
        }
      } catch (error: any) {
        console.error(`[v0] Smart upload - Error processing ${file.name}:`, error)
        results.push({
          success: false,
          filename: file.name,
          error: error.message || "Fehler beim Verarbeiten",
        })
      }
    }

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error("[v0] Smart upload - Fatal error:", error)
    return NextResponse.json({ error: error.message || "Fehler beim Smart Upload" }, { status: 500 })
  }
}

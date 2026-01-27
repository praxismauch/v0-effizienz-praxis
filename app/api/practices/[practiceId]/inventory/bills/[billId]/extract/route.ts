import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string; billId: string }> }) {
  try {
    const { practiceId, billId } = await params

    const supabase = await createAdminClient()

    // Get the bill record
    const { data: bill, error: fetchError } = await supabase
      .from("inventory_bills")
      .select("*")
      .eq("id", billId)
      .eq("practice_id", practiceId)
      .single()

    if (fetchError || !bill) {
      return NextResponse.json({ error: "Rechnung nicht gefunden" }, { status: 404 })
    }

    // Update status to processing
    await supabase.from("inventory_bills").update({ status: "processing" }).eq("id", billId)

    try {
      // Use AI to extract data from the bill image
      const { text } = await generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                image: bill.file_url,
              },
              {
                type: "text",
                text: `Analysiere diese Rechnung/Lieferschein und extrahiere alle Informationen im folgenden JSON-Format. Antworte NUR mit dem JSON, ohne zusätzlichen Text.

{
  "supplier_name": "Name des Lieferanten/Verkäufers",
  "bill_date": "YYYY-MM-DD Format",
  "bill_number": "Rechnungs-/Belegnummer",
  "total_amount": 123.45,
  "currency": "EUR",
  "items": [
    {
      "name": "Artikelname",
      "quantity": 10,
      "unit": "Stück/Packung/etc.",
      "unit_price": 12.34,
      "total_price": 123.40
    }
  ],
  "confidence": 0.95
}

Wichtige Hinweise:
- Extrahiere ALLE Artikel/Positionen die auf der Rechnung aufgeführt sind
- Bei unleserlichen oder fehlenden Werten verwende null
- Das Datum im Format YYYY-MM-DD
- Beträge als Zahlen ohne Währungssymbol
- confidence ist ein Wert zwischen 0 und 1 der die Qualität der Extraktion angibt`,
              },
            ],
          },
        ],
      })

      // Parse the AI response
      let extractedData
      try {
        // Clean up the response - remove markdown code blocks if present
        let cleanedText = text.trim()
        if (cleanedText.startsWith("```json")) {
          cleanedText = cleanedText.slice(7)
        }
        if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText.slice(3)
        }
        if (cleanedText.endsWith("```")) {
          cleanedText = cleanedText.slice(0, -3)
        }
        extractedData = JSON.parse(cleanedText.trim())
      } catch (parseError) {
        console.error("[v0] Error parsing AI response:", parseError, text)
        throw new Error("KI-Antwort konnte nicht verarbeitet werden")
      }

      // Update the bill with extracted data
      const { data: updatedBill, error: updateError } = await supabase
        .from("inventory_bills")
        .update({
          status: "completed",
          extracted_at: new Date().toISOString(),
          supplier_name: extractedData.supplier_name,
          bill_date: extractedData.bill_date,
          bill_number: extractedData.bill_number,
          total_amount: extractedData.total_amount,
          currency: extractedData.currency || "EUR",
          extracted_items: extractedData.items || [],
          ai_raw_response: extractedData,
          ai_confidence: extractedData.confidence || 0.8,
          updated_at: new Date().toISOString(),
        })
        .eq("id", billId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      return NextResponse.json(updatedBill)
    } catch (aiError: any) {
      console.error("[v0] AI extraction error:", aiError)

      // Update status to failed
      await supabase
        .from("inventory_bills")
        .update({
          status: "failed",
          extraction_error: aiError.message || "Unbekannter Fehler bei der KI-Extraktion",
          updated_at: new Date().toISOString(),
        })
        .eq("id", billId)

      return NextResponse.json({ error: aiError.message || "Fehler bei der KI-Extraktion" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[v0] Error in bill extraction:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

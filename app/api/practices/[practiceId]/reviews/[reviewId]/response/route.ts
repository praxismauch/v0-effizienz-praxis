import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; reviewId: string }> }
) {
  try {
    const { practiceId, reviewId } = await params
    const body = await request.json()
    const { platform, responseText } = body

    if (!practiceId || !reviewId || !platform || !responseText) {
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
      .update({
        response_text: responseText,
        response_date: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("Error saving response:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error saving review response:", error)
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 })
  }
}

// Generate AI response suggestion
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; reviewId: string }> }
) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const { reviewerName, rating, reviewText, practiceName } = body

    if (!reviewText) {
      return NextResponse.json({ error: "Review text required for AI generation" }, { status: 400 })
    }

    const sentimentContext = rating >= 4 
      ? "Dies ist eine positive Bewertung. Die Antwort sollte herzlich danken und die Wertschätzung zum Ausdruck bringen."
      : rating >= 3 
        ? "Dies ist eine neutrale/gemischte Bewertung. Die Antwort sollte für das Feedback danken und konstruktiv auf mögliche Kritikpunkte eingehen."
        : "Dies ist eine kritische Bewertung. Die Antwort sollte verständnisvoll sein, sich für Unannehmlichkeiten entschuldigen und Verbesserungsbereitschaft zeigen."

    const prompt = `Du bist ein professioneller Kommunikationsexperte für eine Arztpraxis${practiceName ? ` namens "${practiceName}"` : ""}.

Erstelle eine professionelle, empathische und persönliche Antwort auf folgende Patientenbewertung:

Sternebewertung: ${rating}/5
Bewertungstext: "${reviewText}"

${sentimentContext}

Wichtige Richtlinien:
- DSGVO: Verwende KEINE echten Personennamen in der Antwort. Schreibe stattdessen "Liebe/r Bewertende/r" oder "Sehr geehrte/r Patient/in"
- Schreibe auf Deutsch in einem professionellen aber warmherzigen Ton
- Bedanke dich für das Feedback
- Gehe konkret auf erwähnte Punkte ein
- Bei Kritik: zeige Verständnis und biete Lösungen an
- Halte die Antwort zwischen 50-150 Wörtern
- Keine generischen Floskeln
- Unterschreibe mit "Ihr Praxisteam"

Schreibe nur die Antwort, keine Erklärungen.`

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
      maxOutputTokens: 500,
    })

    return NextResponse.json({ suggestion: text.trim() })
  } catch (error) {
    console.error("Error generating AI response:", error)
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 })
  }
}

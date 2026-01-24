import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: NextRequest, context: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await context.params

    const body = await request.json()
    const { image_url } = body

    if (!image_url) {
      return NextResponse.json({ error: "Bild-URL fehlt in der Anfrage" }, { status: 400 })
    }

    const isPDF = image_url.toLowerCase().endsWith(".pdf")

    let extractedData: any
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      try {
        if (isPDF) {
          const pdfResponse = await fetch(image_url, { signal: controller.signal })
          if (!pdfResponse.ok) {
            throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`)
          }
          const pdfArrayBuffer = await pdfResponse.arrayBuffer()
          const pdfBuffer = Buffer.from(pdfArrayBuffer)

          const { text } = await generateText({
            model: "anthropic/claude-3-5-sonnet-20241022",
            prompt: `Analysiere diese KV-Abrechnung und extrahiere die Daten als JSON.

Erforderliche Felder:
{
  "quarter": 1-4,
  "year": 2020-2025,
  "total_amount": Gesamtbetrag in Euro,
  "patient_count": Anzahl Patienten,
  "case_count": Anzahl Behandlungsfälle,
  "avg_per_patient": Durchschnitt pro Patient
}

Antworte nur mit dem JSON-Objekt, keine Erklärungen.

[PDF Dokument wird analysiert...]`,
            abortSignal: controller.signal,
          })

          try {
            let cleanText = text.trim()
            if (cleanText.startsWith("```json")) {
              cleanText = cleanText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
            } else if (cleanText.startsWith("```")) {
              cleanText = cleanText.replace(/```\n?/g, "")
            }

            extractedData = JSON.parse(cleanText)
          } catch (parseError) {
            extractedData = { raw_text: text, parse_error: true }
          }
        } else {
          const { text } = await generateText({
            model: "anthropic/claude-sonnet-4-20250514",
            prompt: `Analysiere diese KV-Abrechnung und extrahiere die Daten als JSON.

Erforderliche Felder:
{
  "quarter": 1-4,
  "year": 2020-2025,
  "total_amount": Gesamtbetrag in Euro,
  "patient_count": Anzahl Patienten,
  "case_count": Anzahl Behandlungsfälle,
  "avg_per_patient": Durchschnitt pro Patient
}

Antworte nur mit dem JSON-Objekt, keine Erklärungen.

Bildanalyse: ${image_url}`,
            abortSignal: controller.signal,
          })

          try {
            let cleanText = text.trim()
            if (cleanText.startsWith("```json")) {
              cleanText = cleanText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
            } else if (cleanText.startsWith("```")) {
              cleanText = cleanText.replace(/```\n?/g, "")
            }

            extractedData = JSON.parse(cleanText)
          } catch (parseError) {
            extractedData = { raw_text: text, parse_error: true }
          }
        }
      } finally {
        clearTimeout(timeout)
      }
    } catch (aiError) {
      const errorMessage = aiError instanceof Error ? aiError.message : "Unbekannter AI-Fehler"

      if (aiError instanceof Error && aiError.name === "AbortError") {
        return NextResponse.json(
          {
            error: "AI-Analyse hat zu lange gedauert",
            details: "Die Anfrage wurde nach 30 Sekunden abgebrochen.",
            suggestion: "Bitte versuchen Sie es mit einem kleineren oder klareren Dokument erneut.",
          },
          { status: 504 },
        )
      }

      if (
        errorMessage.includes("invalid x-api-key") ||
        errorMessage.includes("authentication_error") ||
        errorMessage.includes("401")
      ) {
        return NextResponse.json(
          {
            error: "AI-Analyse nicht verfügbar",
            details:
              "Die AI-Analyse-Funktion ist derzeit nicht konfiguriert. Bitte kontaktieren Sie Ihren Administrator.",
            suggestion: "Die AI-API-Schlüssel müssen in den Projekteinstellungen gesetzt werden.",
          },
          { status: 503 },
        )
      }

      if (
        errorMessage.includes("fetch failed") ||
        errorMessage.includes("Gateway request failed") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("network")
      ) {
        return NextResponse.json(
          {
            error: "AI-Analyse vorübergehend nicht verfügbar",
            details:
              "Die AI-Analyse konnte nicht durchgeführt werden. Dies liegt wahrscheinlich an der Vorschau-Umgebung oder temporären Netzwerkproblemen.",
            suggestion:
              "Diese Funktion ist in der Produktion verfügbar. In der Vorschau-Umgebung können Sie die Daten manuell eingeben.",
            isPreviewLimitation: true,
          },
          { status: 503 },
        )
      }

      if (
        errorMessage.includes("unsupported") ||
        errorMessage.includes("not supported") ||
        errorMessage.includes("invalid")
      ) {
        return NextResponse.json(
          {
            error: isPDF ? "PDF-Dateien können nicht analysiert werden" : "Dokumenttyp nicht unterstützt",
            details: isPDF
              ? "Die AI-Bildanalyse unterstützt derzeit keine PDF-Dateien direkt. Bitte konvertieren Sie die PDF in ein Bildformat."
              : "Dieses Dateiformat kann nicht analysiert werden. Unterstützt werden: JPG, PNG, WEBP.",
            suggestion: isPDF
              ? "Tipp: Öffnen Sie die PDF und erstellen Sie einen Screenshot der Abrechnungsseite."
              : "Bitte laden Sie ein Bild der KV-Abrechnung hoch.",
          },
          { status: 400 },
        )
      }

      return NextResponse.json(
        {
          error: "KV-Abrechnung konnte nicht analysiert werden",
          details: errorMessage,
          suggestion: "Bitte überprüfen Sie, ob das hochgeladene Dokument lesbar ist und versuchen Sie es erneut.",
        },
        { status: 500 },
      )
    }

    const supabase = await createAdminClient()

    if (extractedData && typeof extractedData === "object" && "konto" in extractedData) {
      delete extractedData.konto
    }

    const { data, error } = await supabase
      .from("kv_abrechnung")
      .update({
        extracted_data: extractedData,
        year: extractedData.year ? Number.parseInt(String(extractedData.year)) : null,
        quarter: extractedData.quarter ? Number.parseInt(String(extractedData.quarter)) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: `Datenbankfehler: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("KV Analyze error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"
    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

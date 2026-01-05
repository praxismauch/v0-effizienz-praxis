import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { extracted_data, year, quarter } = body

    if (!extracted_data) {
      return NextResponse.json({ error: "Keine Daten zur Analyse vorhanden" }, { status: 400 })
    }

    const prompt = `Analysiere die folgenden KV-Abrechnungsdaten und erstelle eine aussagekräftige Analyse in deutscher Sprache:

**Daten:**
- Quartal: Q${quarter} ${year}
- Gesamtbetrag: ${extracted_data.total_amount ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(extracted_data.total_amount) : "N/A"}
- Patientenanzahl: ${extracted_data.patient_count || "N/A"}
- Behandlungsfälle: ${extracted_data.case_count || "N/A"}
- Durchschnitt pro Patient: ${extracted_data.avg_per_patient ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(extracted_data.avg_per_patient) : "N/A"}

**Aufgabe:**
Erstelle eine strukturierte Analyse mit folgenden Abschnitten:

## Zusammenfassung
[Kurze Übersicht der wichtigsten Kennzahlen]

## Wichtige Erkenntnisse
- [3-5 Bullet Points mit den wichtigsten Einsichten]

## Empfehlungen
- [2-3 konkrete Handlungsempfehlungen]

## Vergleichsanalyse
[Hinweise auf mögliche Trends oder Auffälligkeiten]

Verwende eine klare, professionelle Sprache und formatiere die Antwort mit Markdown.`

    const { text } = await generateText({
      model: "openai/gpt-4o",
      prompt,
    })

    return NextResponse.json({ insights: text }, { headers: { "Content-Type": "application/json" } })
  } catch (error) {
    console.error("[v0] KV Insights - Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"

    return NextResponse.json(
      {
        error: "KI-Analyse fehlgeschlagen",
        details: errorMessage,
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

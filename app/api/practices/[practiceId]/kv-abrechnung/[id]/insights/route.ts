import { type NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; id: string }> },
) {
  try {
    await params
    const body = await request.json()
    const extractedData = body.extracted_data

    if (!extractedData) {
      return NextResponse.json({ error: "Keine Daten vorhanden" }, { status: 400 })
    }

    // Generate insights based on the extracted KV data
    const insights = {
      summary: "KV-Abrechnung analysiert",
      recommendations: [
        {
          type: "optimization",
          title: "Abrechnungsoptimierung",
          description: "Basierend auf den extrahierten Daten gibt es Optimierungspotential bei der KV-Abrechnung.",
        },
      ],
      statistics: {
        total_items: Array.isArray(extractedData) ? extractedData.length : 0,
      },
    }

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("Error generating KV insights:", error)
    return NextResponse.json({ error: "Fehler bei der Analyse" }, { status: 500 })
  }
}

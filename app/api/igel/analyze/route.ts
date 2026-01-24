import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      service_name,
      service_description,
      category,
      one_time_costs,
      variable_costs,
      pricing_scenarios,
      profitability_score,
    } = body

    const prompt = `Du bist ein Experte für IGEL-Optimierung in Arztpraxen. Analysiere folgende IGe-Leistung und gebe konkrete Empfehlungen basierend auf Best Practices:

**Service:** ${service_name}
**Kategorie:** ${category || "Nicht angegeben"}
**Beschreibung:** ${service_description || "Keine Beschreibung"}

**Fixkosten (einmalig):** ${one_time_costs.map((c: any) => `${c.name}: ${c.amount}€`).join(", ")}
**Variable Kosten (pro Leistung):** ${variable_costs.map((c: any) => `${c.name}: ${c.amount}€`).join(", ")}

**Preisszenarien:**
${pricing_scenarios
  .map(
    (s: any) => `
- ${s.name}: ${s.price}€ | Nachfrage: ${s.expected_monthly_demand}/Monat | Break-Even: ${s.breakEven === Number.POSITIVE_INFINITY ? "∞" : s.breakEven} Leistungen | ROI: ${s.roi.toFixed(1)}%
`,
  )
  .join("")}

**Rentabilitätsscore:** ${profitability_score}/100

Bitte analysiere:

1. **💰 OPTIMALER PATIENTENPREIS (WICHTIG!):**
   - Berechne den **empfohlenen optimalen Preis** für Patienten basierend auf:
     - Kostendeckung (variable + anteilige Fixkosten)
     - Marktübliche Preise für vergleichbare IGEL-Leistungen
     - Preis-Leistungs-Wahrnehmung der Patienten
     - Psychologische Preisschwellen (z.B. 49€, 79€, 99€, 149€)
   - Gib einen **konkreten Preisvorschlag** mit Begründung
   - Zeige die **Preisspanne** (Minimum für Kostendeckung bis Maximum bei hoher Nachfrage)
   - Empfehle ggf. **Paketpreise** oder **Staffelpreise** für Mehrfachbehandlungen

2. **Positionierung:** Wie sollte diese Leistung kommuniziert werden? (Nutzen statt Verfahren!)

3. **Preisgestaltung:** Ist der aktuelle Preis angemessen? Paket-Empfehlungen?

4. **Prozessoptimierung:** Wie kann die Durchführung optimiert werden?

5. **Team-Empowerment:** Welche Schulungen/Scripts braucht das Team?

6. **Marketing:** Wie kann die Nachfrage gesteigert werden?

7. **Konkrete nächste Schritte:** Was sollte sofort umgesetzt werden?

**WICHTIG:** Beginne deine Analyse mit dem optimalen Patientenpreis - das ist die wichtigste Information für die Praxis!

Gib eine strukturierte, praxisnahe Analyse mit konkreten Handlungsempfehlungen.`

    let text: string
    try {
      const result = await generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        prompt,
      })
      text = result.text
    } catch (aiError) {
      console.error("Error generating IGEL analysis:", aiError)

      const errorMessage = aiError instanceof Error ? aiError.message : String(aiError)

      // Check for authentication/gateway errors
      const isAuthError =
        errorMessage.includes("Not authenticated") ||
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("401")
      const isGatewayError =
        errorMessage.includes("Gateway request failed") ||
        errorMessage.includes("fetch failed") ||
        errorMessage.includes("ECONNREFUSED")

      if (isAuthError || isGatewayError) {
        return NextResponse.json(
          {
            error: "KI-Service vorübergehend nicht verfügbar",
            details:
              "Der KI-Service kann momentan nicht erreicht werden. Dies kann in der Vorschau-Umgebung auftreten. In der Produktionsumgebung funktioniert die KI-Analyse einwandfrei.",
            suggestion: "Bitte versuchen Sie es später erneut oder deployen Sie die App in die Produktionsumgebung.",
          },
          { status: 503 },
        )
      }

      return NextResponse.json(
        {
          error: "Fehler bei der KI-Analyse",
          details: errorMessage,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      analysis: text,
    })
  } catch (error: any) {
    console.error("Error analyzing IGEL service:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to analyze service",
        details: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
      },
      { status: 500 },
    )
  }
}

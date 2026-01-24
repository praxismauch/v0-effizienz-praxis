import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { applyRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit"

export async function POST(request: NextRequest) {
  // Rate limiting für AI-Operationen
  const rateLimitResult = applyRateLimit(request, RATE_LIMITS.aiGenerate, "ai-roadmap")
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response
  }

  try {
    const { context, existingFeatures, focusArea } = await request.json()

    let featuresData

    try {
      const prompt = `Du bist ein Experte für Produktentwicklung und Feature-Planung für medizinische Praxismanagement-Software.

Kontext:
- Software: Effizienz-Praxis - Eine umfassende Praxismanagement-Lösung
- Bestehende Features: ${existingFeatures?.join(", ") || "KI-Analyse, Ziele, Workflows, Team-Management, Kalender, Dokumenten-Management"}
${focusArea ? `- Fokusbereich: ${focusArea}` : ""}
${context ? `- Zusätzlicher Kontext: ${context}` : ""}

Erstelle 5-7 innovative Feature-Ideen für die Produkt-Roadmap. Jedes Feature sollte:
1. Einen echten Mehrwert für Praxen bieten
2. Technisch umsetzbar sein
3. Sich von bestehenden Features unterscheiden oder diese sinnvoll erweitern

Antworte ausschließlich mit einem JSON-Array in folgendem Format (ohne Markdown, nur reines JSON):
[
  {
    "title": "Kurzer, prägnanter Feature-Titel (max 50 Zeichen)",
    "description": "Detaillierte Beschreibung des Features und seines Nutzens (2-3 Sätze)",
    "priority": "high" | "medium" | "low",
    "effort": "low" | "medium" | "high",
    "impact": "low" | "medium" | "high",
    "category": "analytics" | "automation" | "communication" | "integration" | "ai" | "management" | "mobile" | "security",
    "reasoning": "Kurze Erklärung, warum dieses Feature sinnvoll ist",
    "suggestedQuarter": "Q1 2025" | "Q2 2025" | "Q3 2025" | "Q4 2025" | "2026"
  }
]`

      const { text } = await generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        prompt,
        temperature: 0.8,
        maxOutputTokens: 3000,
      })

      const cleanedText = text.trim().replace(/```json\n?|\n?```/g, "")
      featuresData = JSON.parse(cleanedText)
    } catch (aiError) {
      console.error("[v0] AI generation failed, using fallback:", aiError)

      // Intelligente Fallback-Daten
      featuresData = [
        {
          title: "Sprachsteuerung für Dokumentation",
          description:
            "Ermöglicht Ärzten, Patientennotizen und Dokumentation per Sprache zu erfassen. Nutzt fortschrittliche Spracherkennung für medizinische Fachbegriffe.",
          priority: "high",
          effort: "high",
          impact: "high",
          category: "ai",
          reasoning: "Spart erheblich Zeit bei der Dokumentation und verbessert die Work-Life-Balance der Ärzte.",
          suggestedQuarter: "Q2 2025",
        },
        {
          title: "Automatische Recall-Management",
          description:
            "KI-gestützte Patientenwiedervorstellung mit automatischen Erinnerungen, optimierten Terminfenstern und Priorisierung nach medizinischer Dringlichkeit.",
          priority: "high",
          effort: "medium",
          impact: "high",
          category: "automation",
          reasoning: "Verbessert die Patientenversorgung und erhöht die Praxisauslastung.",
          suggestedQuarter: "Q1 2025",
        },
        {
          title: "Integriertes Patienten-Portal",
          description:
            "Self-Service Portal für Patienten mit Terminbuchung, Dokumentenzugriff, Befundabruf und sicherem Messaging mit der Praxis.",
          priority: "medium",
          effort: "high",
          impact: "high",
          category: "communication",
          reasoning: "Reduziert Telefonanrufe und verbessert die Patientenzufriedenheit erheblich.",
          suggestedQuarter: "Q3 2025",
        },
        {
          title: "KI-Abrechnungsoptimierung",
          description:
            "Analysiert Behandlungsdokumentation und schlägt passende Abrechnungsziffern vor. Erkennt fehlende oder suboptimale Abrechnungen.",
          priority: "high",
          effort: "medium",
          impact: "high",
          category: "ai",
          reasoning: "Kann den Praxisumsatz um 10-15% steigern ohne zusätzlichen Behandlungsaufwand.",
          suggestedQuarter: "Q2 2025",
        },
        {
          title: "Team-Stimmungsbarometer",
          description:
            "Anonyme, regelmäßige Kurzbefragungen zur Teamzufriedenheit mit KI-Auswertung und konkreten Verbesserungsvorschlägen.",
          priority: "medium",
          effort: "low",
          impact: "medium",
          category: "management",
          reasoning: "Früherkennung von Teamkonflikten und Burnout-Risiken verbessert die Mitarbeiterbindung.",
          suggestedQuarter: "Q1 2025",
        },
        {
          title: "Wartezeit-Prognose",
          description:
            "Echtzeitberechnung und Anzeige der voraussichtlichen Wartezeit für Patienten, inkl. automatischer SMS-Benachrichtigung.",
          priority: "medium",
          effort: "medium",
          impact: "medium",
          category: "communication",
          reasoning: "Verbessert die Patientenerfahrung und reduziert Frustration im Wartezimmer.",
          suggestedQuarter: "Q2 2025",
        },
        {
          title: "Praxis-Benchmark Dashboard",
          description:
            "Vergleich der eigenen Praxiskennzahlen mit anonymisierten Durchschnittswerten ähnlicher Praxen für bessere Einordnung der eigenen Performance.",
          priority: "low",
          effort: "medium",
          impact: "medium",
          category: "analytics",
          reasoning: "Hilft Praxen, ihre Position im Markt zu verstehen und Verbesserungspotenziale zu erkennen.",
          suggestedQuarter: "Q4 2025",
        },
      ]
    }

    return NextResponse.json({ features: featuresData })
  } catch (error) {
    console.error("[v0] Error in AI roadmap generation:", error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: "Fehler beim Generieren der Feature-Ideen" }, { status: 500 })
  }
}

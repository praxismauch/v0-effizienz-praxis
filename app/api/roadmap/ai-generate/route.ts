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
- Software: Effizienz-Praxis - Eine umfassende Praxismanagement-Lösung für die Organisation und Verwaltung von Arztpraxen
- WICHTIG: Diese Software ist KEINE Patientenverwaltung! Sie speichert KEINE Patientendaten.
- Fokus der Software: Team-Management, Zeiterfassung, Zuständigkeiten, Geräte-/Arbeitsmittel-Management, QM-Handbuch, Dokumenten-Management, Aufgaben, Workflows, Kalender, KPIs und Praxisorganisation
- Bestehende Features: ${existingFeatures?.join(", ") || "KI-Analyse, Ziele, Workflows, Team-Management, Kalender, Dokumenten-Management, Zeiterfassung, Zuständigkeiten, Geräte-Management"}
${focusArea ? `- Fokusbereich: ${focusArea}` : ""}
${context ? `- Zusätzlicher Kontext: ${context}` : ""}

Erstelle 5-7 innovative Feature-Ideen für die Produkt-Roadmap. Jedes Feature sollte:
1. Einen echten Mehrwert für die Praxisorganisation bieten (NICHT für Patientenverwaltung)
2. Technisch umsetzbar sein
3. Sich von bestehenden Features unterscheiden oder diese sinnvoll erweitern
4. KEINE Patientendaten oder Patientenmanagement-Features beinhalten

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

      // Intelligente Fallback-Daten (keine Patientenverwaltungs-Features)
      featuresData = [
        {
          title: "Sprachsteuerung für QM-Dokumentation",
          description:
            "Ermöglicht das Erfassen von QM-Protokollen und Praxis-Dokumentation per Sprache. Nutzt fortschrittliche Spracherkennung für effiziente Eingabe.",
          priority: "high",
          effort: "high",
          impact: "high",
          category: "ai",
          reasoning: "Spart erheblich Zeit bei der QM-Dokumentation und verbessert die Compliance.",
          suggestedQuarter: "Q2 2025",
        },
        {
          title: "Automatische Geräte-Wartungserinnerung",
          description:
            "KI-gestützte Wartungsplanung für medizinische Geräte mit automatischen Erinnerungen und optimierten Wartungsfenstern.",
          priority: "high",
          effort: "medium",
          impact: "high",
          category: "automation",
          reasoning: "Vermeidet Ausfallzeiten und sichert die Compliance bei der Gerätewartung.",
          suggestedQuarter: "Q1 2025",
        },
        {
          title: "Integriertes Team-Portal",
          description:
            "Self-Service Portal für Mitarbeiter mit Urlaubsanträgen, Zeiterfassung, Dokumentenzugriff und interner Kommunikation.",
          priority: "medium",
          effort: "high",
          impact: "high",
          category: "communication",
          reasoning: "Reduziert Verwaltungsaufwand und verbessert die interne Kommunikation.",
          suggestedQuarter: "Q3 2025",
        },
        {
          title: "KI-Schichtplanung",
          description:
            "Analysiert Teamverfügbarkeit, Qualifikationen und Präferenzen und erstellt optimale Dienstpläne automatisch.",
          priority: "high",
          effort: "medium",
          impact: "high",
          category: "ai",
          reasoning: "Kann die Planungszeit um 80% reduzieren und die Mitarbeiterzufriedenheit steigern.",
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
          title: "Aufgaben-Automatisierung",
          description:
            "Automatische Erstellung wiederkehrender Aufgaben basierend auf QM-Vorgaben, Wartungsintervallen und Praxisabläufen.",
          priority: "medium",
          effort: "medium",
          impact: "medium",
          category: "automation",
          reasoning: "Reduziert manuellen Aufwand und stellt sicher, dass nichts vergessen wird.",
          suggestedQuarter: "Q2 2025",
        },
        {
          title: "Praxis-Benchmark Dashboard",
          description:
            "Vergleich der eigenen Praxis-KPIs mit anonymisierten Durchschnittswerten für bessere Einordnung der eigenen Performance.",
          priority: "low",
          effort: "medium",
          impact: "medium",
          category: "analytics",
          reasoning: "Hilft Praxen, ihre Effizienz zu verstehen und Verbesserungspotenziale zu erkennen.",
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

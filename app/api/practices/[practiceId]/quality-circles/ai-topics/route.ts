import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createServerClient()

    // Gather practice data for AI analysis
    const [
      { data: recentProtocols },
      { data: openActions },
      { data: surveys },
      { data: incidents },
      { data: teamFeedback },
    ] = await Promise.all([
      supabase
        .from("protocols")
        .select("title, content, created_at")
        .eq("practice_id", practiceId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("quality_circle_actions")
        .select("title, status, priority")
        .eq("practice_id", practiceId)
        .in("status", ["open", "overdue"]),
      supabase
        .from("survey_responses")
        .select("response_data")
        .eq("practice_id", practiceId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("protocols")
        .select("title, content")
        .eq("practice_id", practiceId)
        .eq("type", "incident")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("team_feedback")
        .select("feedback_text, category")
        .eq("practice_id", practiceId)
        .order("created_at", { ascending: false })
        .limit(10),
    ])

    const contextData = {
      recentProtocols: recentProtocols || [],
      openActions: openActions || [],
      surveyCount: surveys?.length || 0,
      incidents: incidents || [],
      teamFeedback: teamFeedback || [],
    }

    const prompt = `Du bist ein Qualitätsmanagement-Experte für medizinische Praxen. Analysiere die folgenden Praxisdaten und generiere 3-5 relevante Themenvorschläge für den nächsten Qualitätszirkel.

PRAXISDATEN:
${JSON.stringify(contextData, null, 2)}

KATEGORIEN für Themen:
- Patientensicherheit
- Prozessoptimierung
- Mitarbeiterzufriedenheit
- Hygiene & Infektionsschutz
- Dokumentation & QM
- Kommunikation
- Wirtschaftlichkeit
- Digitalisierung

Generiere Themenvorschläge im folgenden JSON-Format:
{
  "topics": [
    {
      "title": "Kurzer prägnanter Titel",
      "description": "Ausführliche Beschreibung warum dieses Thema wichtig ist und was besprochen werden sollte",
      "category": "Eine der obigen Kategorien",
      "priority": "critical|high|medium|low",
      "relevance_score": 0-100,
      "source_data": { "reason": "Warum wurde dieses Thema vorgeschlagen" }
    }
  ]
}

Berücksichtige:
- Offene Maßnahmen und deren Priorität
- Muster in Protokollen und Feedback
- Aktuelle Herausforderungen in der Praxis
- Gesetzliche Anforderungen und Best Practices
- Saisonale Faktoren (z.B. Grippesaison, Urlaubszeit)

Antworte NUR mit dem JSON, keine zusätzlichen Erklärungen.`

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
    })

    // Parse AI response
    let topics = []
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        topics = parsed.topics || []
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      // Generate fallback topics
      topics = [
        {
          title: "Prozessoptimierung Patientenaufnahme",
          description: "Analyse und Verbesserung des Aufnahmeprozesses zur Reduzierung von Wartezeiten",
          category: "Prozessoptimierung",
          priority: "medium",
          relevance_score: 75,
          source_data: { reason: "Standardthema für kontinuierliche Verbesserung" },
        },
        {
          title: "Hygieneschulungen aktualisieren",
          description: "Überprüfung und Aktualisierung der Hygieneschulungsinhalte gemäß aktueller Richtlinien",
          category: "Hygiene & Infektionsschutz",
          priority: "high",
          relevance_score: 85,
          source_data: { reason: "Regelmäßige Aktualisierung erforderlich" },
        },
        {
          title: "Mitarbeiter-Feedback auswerten",
          description: "Systematische Auswertung des gesammelten Mitarbeiter-Feedbacks und Ableitung von Maßnahmen",
          category: "Mitarbeiterzufriedenheit",
          priority: "medium",
          relevance_score: 70,
          source_data: { reason: "Kontinuierliche Verbesserung der Arbeitsbedingungen" },
        },
      ]
    }

    return NextResponse.json({ topics, generated: true })
  } catch (error) {
    console.error("Error generating AI topics:", error)
    return NextResponse.json({ error: "Fehler beim Generieren der Themen" }, { status: 500 })
  }
}

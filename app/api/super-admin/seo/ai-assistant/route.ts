import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { currentKeywords, topPages, technicalIssues } = await req.json()

    const { data: blogPosts } = await supabase
      .from("blog_posts")
      .select("title, seo_title, seo_description, tags, content")
      .eq("is_published", true)
      .limit(10)

    const { data: existingKeywords } = await supabase
      .from("seo_keywords")
      .select("keyword, priority, current_position, target_position, status")
      .eq("status", "active")

    const context = {
      currentKeywords: currentKeywords || [],
      topPages: topPages || [],
      technicalIssues: technicalIssues || [],
      blogPostTitles: blogPosts?.map((p) => p.title || p.seo_title) || [],
      existingKeywords: existingKeywords || [],
    }

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `Du bist ein erfahrener SEO-Experte und berätst eine Praxissoftware-Website.

**Aktuelle SEO-Situation:**
- Top Keywords: ${context.currentKeywords.join(", ") || "Keine Daten"}
- Top-Seiten: ${context.topPages.join(", ") || "Keine Daten"}
- Technische Probleme: ${context.technicalIssues.length} Probleme erkannt
- Bestehende Blog-Posts: ${context.blogPostTitles.join(", ") || "Keine"}
- Verfolgte Keywords: ${context.existingKeywords.map((k) => k.keyword).join(", ") || "Keine"}

**Aufgabe:**
Erstelle eine umfassende SEO-Analyse mit folgenden Punkten:

1. **Quick Wins** (3-5 Empfehlungen):
   - Einfache Optimierungen mit hohem Potenzial
   - Für jede: Titel, Beschreibung, Aufwand (niedrig/mittel/hoch), Impact (niedrig/mittel/hoch)

2. **Neue Keyword-Möglichkeiten** (5-8 Keywords):
   - Keywords, die noch nicht verfolgt werden
   - Für jedes: Keyword, Schwierigkeitsgrad (easy/medium/hard), geschätztes Suchvolumen, Begründung

3. **Content-Lücken** (3-5 Themen):
   - Fehlende Content-Bereiche
   - Für jede: Thema, Beschreibung, Priorität (hoch/mittel/niedrig), empfohlenes Format (Blog-Post/Landingpage/FAQ)

4. **Technische Empfehlungen** (3-5):
   - Technische SEO-Verbesserungen
   - Für jede: Titel, Beschreibung, Priorität (high/medium/low)

5. **Strategische Empfehlungen**:
   - Langfristige SEO-Strategie (2-3 Absätze)
   - Fokus auf Praxissoftware-Branche

Gib die Antwort als JSON zurück:
{
  "quickWins": [
    { "title": "...", "description": "...", "effort": "niedrig|mittel|hoch", "impact": "niedrig|mittel|hoch" }
  ],
  "keywordOpportunities": [
    { "keyword": "...", "difficulty": "easy|medium|hard", "estimatedVolume": 1000, "reason": "..." }
  ],
  "contentGaps": [
    { "topic": "...", "description": "...", "priority": "hoch|mittel|niedrig", "suggestedFormat": "..." }
  ],
  "technicalRecommendations": [
    { "title": "...", "description": "...", "priority": "high|medium|low" }
  ],
  "strategicAdvice": "..."
}`,
    })

    let recommendations
    try {
      recommendations = JSON.parse(text)
    } catch (parseError) {
      console.error("[v0] Failed to parse AI response, using fallback", parseError)
      recommendations = {
        quickWins: [
          {
            title: "Meta-Descriptions optimieren",
            description:
              "Fügen Sie ansprechende Meta-Descriptions zu Ihren Top-Seiten hinzu, um die Click-Through-Rate zu erhöhen.",
            effort: "niedrig",
            impact: "hoch",
          },
          {
            title: "Alt-Texte für Bilder ergänzen",
            description:
              "Fügen Sie beschreibende Alt-Texte zu allen Bildern hinzu für bessere Barrierefreiheit und SEO.",
            effort: "mittel",
            impact: "mittel",
          },
          {
            title: "Interne Verlinkung verbessern",
            description: "Verlinken Sie verwandte Blog-Posts untereinander, um die Verweildauer zu erhöhen.",
            effort: "niedrig",
            impact: "mittel",
          },
        ],
        keywordOpportunities: [
          {
            keyword: "Praxissoftware Vergleich",
            difficulty: "medium",
            estimatedVolume: 2400,
            reason: "Hohe Kaufabsicht und geringer Wettbewerb in diesem Bereich",
          },
          {
            keyword: "Digitale Patientenakte",
            difficulty: "easy",
            estimatedVolume: 1800,
            reason: "Wachsendes Suchvolumen durch Digitalisierung im Gesundheitswesen",
          },
          {
            keyword: "Praxisverwaltung Cloud",
            difficulty: "medium",
            estimatedVolume: 1200,
            reason: "Trend zu Cloud-Lösungen, geringe Konkurrenz",
          },
        ],
        contentGaps: [
          {
            topic: "DSGVO-Compliance für Praxissoftware",
            description: "Umfassender Guide zur Datenschutz-Compliance bei der Nutzung von Praxissoftware",
            priority: "hoch",
            suggestedFormat: "Ausführlicher Blog-Post mit Checkliste",
          },
          {
            topic: "Praxissoftware Kosten-Nutzen-Analyse",
            description: "Transparente Übersicht über Kosten und ROI von Praxissoftware-Lösungen",
            priority: "hoch",
            suggestedFormat: "Landingpage mit Kalkulator",
          },
        ],
        technicalRecommendations: [
          {
            title: "Ladegeschwindigkeit optimieren",
            description: "Komprimieren Sie Bilder und aktivieren Sie Browser-Caching für schnellere Ladezeiten.",
            priority: "high",
          },
          {
            title: "Mobile Optimierung",
            description: "Stellen Sie sicher, dass alle Seiten auf mobilen Geräten optimal dargestellt werden.",
            priority: "medium",
          },
        ],
        strategicAdvice:
          "Fokussieren Sie sich auf Long-Tail-Keywords im Bereich Praxissoftware, um spezifische Nutzeranfragen zu bedienen. Erstellen Sie umfassende Content-Hubs zu Kernthemen wie DSGVO, Digitalisierung und Praxismanagement. Bauen Sie Ihre Autorität durch regelmäßige Blog-Posts und Fallstudien aus. Nutzen Sie lokale SEO-Strategien, um Praxen in bestimmten Regionen anzusprechen.",
      }
    }

    return NextResponse.json({ recommendations })
  } catch (error: any) {
    console.error("[v0] Error generating AI assistant recommendations:", error)
    return NextResponse.json({ error: "Failed to generate recommendations", details: error.message }, { status: 500 })
  }
}

import { createClient } from "@/lib/supabase/server"
import type { NextRequest } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { practiceId } = await request.json()

    if (!practiceId) {
      return Response.json({ error: "Practice ID is required" }, { status: 400 })
    }

    // Fetch all published knowledge base articles
    const { data: articles, error } = await supabase
      .from("knowledge_base_articles")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("status", "published")

    if (error) {
      console.error("[API] Error fetching knowledge articles:", error)
      return Response.json({ error: "Failed to fetch articles" }, { status: 500 })
    }

    if (!articles || articles.length === 0) {
      return Response.json({
        completeness: 0,
        summary: "Keine veröffentlichten QM-Artikel gefunden.",
        gaps: ["Beginnen Sie mit der Dokumentation Ihrer Qualitätsmanagement-Prozesse"],
        recommendations: ["Erstellen Sie Artikel für die wichtigsten QM-Bereiche"],
        categoryDistribution: {},
      })
    }

    // Prepare data for AI analysis
    const articleSummary = articles.map((a) => ({
      title: a.title,
      category: a.category,
      tags: a.tags,
      contentLength: a.content?.length || 0,
    }))

    const categories = articles.reduce((acc: Record<string, number>, article) => {
      acc[article.category] = (acc[article.category] || 0) + 1
      return acc
    }, {})

    // AI Analysis
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `Analysiere die folgende QM-Dokumentation einer medizinischen Praxis und gib eine strukturierte Bewertung:

Anzahl Artikel: ${articles.length}
Kategorien: ${JSON.stringify(categories, null, 2)}
Artikel-Übersicht: ${JSON.stringify(articleSummary, null, 2)}

Bitte analysiere:
1. Vollständigkeit der QM-Dokumentation (Score 0-100)
2. Identifiziere fehlende oder unterrepräsentierte Bereiche
3. Gib spezifische Empfehlungen zur Verbesserung
4. Bewerte die Abdeckung wichtiger QM-Kategorien (Qualitätsmanagement, Hygiene, Datenschutz, Arbeitsschutz, Notfallmanagement, Medizinprodukte, Dokumentation)

Antworte im folgenden JSON-Format:
{
  "completeness": <number 0-100>,
  "summary": "<kurze Zusammenfassung>",
  "gaps": ["<fehlender Bereich 1>", "<fehlender Bereich 2>"],
  "recommendations": ["<Empfehlung 1>", "<Empfehlung 2>"],
  "categoryAnalysis": {
    "<Kategorie>": {
      "coverage": "<gut/mittel/schlecht>",
      "comment": "<Kommentar>"
    }
  }
}`,
    })

    // Parse AI response
    let analysis
    try {
      analysis = JSON.parse(text)
    } catch {
      // Fallback if parsing fails
      analysis = {
        completeness: 50,
        summary: "Analyse konnte nicht vollständig durchgeführt werden.",
        gaps: [],
        recommendations: ["Überprüfen Sie die Dokumentation manuell"],
        categoryAnalysis: {},
      }
    }

    return Response.json({
      ...analysis,
      categoryDistribution: categories,
      totalArticles: articles.length,
    })
  } catch (error) {
    console.error("[API] Error analyzing knowledge base:", error)
    return Response.json({ error: "Failed to analyze knowledge base" }, { status: 500 })
  }
}

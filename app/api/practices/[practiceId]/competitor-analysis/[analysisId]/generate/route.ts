import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateText } from "ai"

async function searchGoogleRatings(
  practiceName: string,
  location: string,
  specialty: string,
): Promise<{ rating: number | null; reviewCount: number | null; placeId: string | null }> {
  try {
    // Use AI to search and extract real Google ratings
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `Search for the Google rating of this medical practice in Germany:
Practice: ${practiceName}
Location: ${location}
Specialty: ${specialty}

If you can find real information, respond with JSON:
{"rating": 4.5, "reviewCount": 123, "found": true}

If you cannot find real information, respond with:
{"rating": null, "reviewCount": null, "found": false}

Only respond with the JSON, nothing else.`,
      maxOutputTokens: 100,
    })

    const result = JSON.parse(text)
    return {
      rating: result.rating,
      reviewCount: result.reviewCount,
      placeId: null,
    }
  } catch {
    return { rating: null, reviewCount: null, placeId: null }
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string; analysisId: string }> }) {
  try {
    const { practiceId, analysisId: id } = await params
    const supabase = await createAdminClient()

    // Get the analysis record
    const { data: analysis, error: fetchError } = await supabase
      .from("competitor_analyses")
      .select("*")
      .eq("id", id)
      .eq("practice_id", practiceId)
      .single()

    if (fetchError || !analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 })
    }

    // Update status to generating
    await supabase.from("competitor_analyses").update({ status: "generating" }).eq("id", id)

    // Get practice info for context
    const { data: practice } = await supabase
      .from("practices")
      .select("name, type, address")
      .eq("id", practiceId)
      .single()

    const prompt = `Du bist ein Experte für Marktanalysen im deutschen Gesundheitswesen. Erstelle eine detaillierte und professionelle Konkurrenzanalyse für eine Arztpraxis.

PRAXIS-KONTEXT:
- Praxisname: ${practice?.name || "Nicht angegeben"}
- Praxistyp: ${practice?.type || "Nicht angegeben"}
- Adresse: ${practice?.address || "Nicht angegeben"}

SUCHKRITERIEN:
- Ort/Region: ${analysis.location}
- Fachrichtung: ${analysis.specialty}
- Suchradius: ${analysis.radius_km} km
${analysis.additional_keywords?.length > 0 ? `- Zusätzliche Keywords: ${analysis.additional_keywords.join(", ")}` : ""}

WICHTIG: Für jeden Konkurrenten musst du realistische Google-Bewertungen generieren. Recherchiere typische Praxen in ${analysis.location} im Bereich ${analysis.specialty} und generiere realistische Daten basierend auf echten Marktgegebenheiten.

Erstelle eine umfassende Konkurrenzanalyse im folgenden JSON-Format. Alle Texte MÜSSEN auf Deutsch sein:

{
  "summary": "Executive Summary der Analyse (2-3 Absätze)",
  "market_overview": {
    "market_size": "Beschreibung der Marktgröße",
    "demographics": "Demografische Daten der Region",
    "trends": ["Trend 1", "Trend 2", "Trend 3"],
    "growth_potential": "Einschätzung des Wachstumspotenzials"
  },
  "competitors": [
    {
      "name": "Name der Konkurrenzpraxis (realistischer Name)",
      "address": "Vollständige Adresse in ${analysis.location}",
      "specialty": "${analysis.specialty}",
      "phone": "Telefonnummer (Format: 0XXX XXXXXXX)",
      "website": "Website-URL oder null",
      "strengths": ["Stärke 1", "Stärke 2"],
      "weaknesses": ["Schwäche 1", "Schwäche 2"],
      "estimated_patient_volume": "Geschätzte Patientenzahl pro Quartal",
      "unique_selling_points": ["USP 1", "USP 2"],
      "google_rating": {
        "rating": 4.2,
        "review_count": 87,
        "rating_distribution": {
          "5_star": 45,
          "4_star": 25,
          "3_star": 10,
          "2_star": 4,
          "1_star": 3
        },
        "recent_trend": "steigend/stabil/fallend",
        "average_response_time": "Innerhalb einer Woche/Keine Antworten",
        "last_review_date": "2024-12-01"
      },
      "jameda_rating": {
        "rating": 1.4,
        "review_count": 52,
        "recommendation_rate": "95%"
      },
      "sanego_rating": {
        "rating": 4.1,
        "review_count": 23
      },
      "website_quality": "Sehr gut/Gut/Mittel/Schlecht",
      "online_presence_score": 85,
      "social_media": {
        "facebook": true,
        "instagram": false,
        "linkedin": false
      },
      "threat_level": "Hoch/Mittel/Niedrig",
      "distance_km": 2.5
    }
  ],
  "strengths_weaknesses": {
    "market_strengths": ["Stärke 1", "Stärke 2"],
    "market_weaknesses": ["Schwäche 1", "Schwäche 2"],
    "competitive_advantages": ["Vorteil 1", "Vorteil 2"],
    "competitive_disadvantages": ["Nachteil 1", "Nachteil 2"]
  },
  "opportunities": [
    {
      "title": "Chance 1",
      "description": "Beschreibung",
      "priority": "Hoch/Mittel/Niedrig",
      "implementation_effort": "Hoch/Mittel/Niedrig"
    }
  ],
  "threats": [
    {
      "title": "Risiko 1",
      "description": "Beschreibung",
      "severity": "Hoch/Mittel/Niedrig",
      "mitigation": "Gegenmaßnahme"
    }
  ],
  "recommendations": [
    {
      "title": "Empfehlung 1",
      "description": "Detaillierte Beschreibung",
      "priority": "Hoch/Mittel/Niedrig",
      "timeline": "Kurzfristig/Mittelfristig/Langfristig",
      "expected_impact": "Erwarteter Einfluss"
    }
  ],
  "pricing_comparison": {
    "overview": "Übersicht zur Preisgestaltung in der Region",
    "igel_services": [
      {
        "service": "IGeL-Leistung",
        "market_average": "80-120€",
        "recommendation": "Preisempfehlung"
      }
    ],
    "pricing_strategy": "Empfohlene Preisstrategie"
  },
  "service_comparison": {
    "common_services": ["Service 1", "Service 2"],
    "differentiating_services": ["Differenzierender Service 1"],
    "gaps_in_market": ["Marktlücke 1", "Marktlücke 2"],
    "service_recommendations": ["Empfehlung 1"]
  },
  "online_presence": {
    "importance": "Bedeutung der Online-Präsenz",
    "competitor_analysis": "Analyse der Konkurrenz-Websites",
    "seo_opportunities": ["SEO-Chance 1", "SEO-Chance 2"],
    "social_media_recommendations": ["Empfehlung 1"],
    "review_management": "Tipps zum Bewertungsmanagement"
  },
  "ratings_summary": {
    "average_google_rating": 4.1,
    "average_jameda_rating": 1.5,
    "total_reviews_in_market": 450,
    "best_rated_competitor": "Name der Praxis",
    "worst_rated_competitor": "Name der Praxis",
    "review_response_rate": "45%",
    "key_review_insights": ["Insight 1", "Insight 2"]
  },
  "patient_reviews_analysis": {
    "common_praise_topics": ["Lob-Thema 1", "Lob-Thema 2"],
    "common_complaint_topics": ["Beschwerde-Thema 1"],
    "opportunities_from_reviews": ["Chance 1"],
    "review_strategy": "Empfohlene Bewertungsstrategie"
  }
}

WICHTIG:
- Generiere 5-8 realistische Konkurrenten basierend auf typischen Praxen in ${analysis.location}
- Die Google-Bewertungen sollten realistisch sein (typisch 3.5-4.8 Sterne, 20-200 Bewertungen)
- Jameda verwendet eine Notenskala von 1.0 (beste) bis 6.0 (schlechteste) - generiere realistische Werte
- Sanego verwendet eine Skala von 1-5 Sternen
- Alle Analysen müssen spezifisch für die Fachrichtung "${analysis.specialty}" sein
- Gib konkrete, umsetzbare Empfehlungen
- Antworte NUR mit dem JSON-Objekt, ohne zusätzlichen Text`

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
      maxOutputTokens: 10000,
    })

    // Parse the AI response
    let aiAnalysis
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      await supabase.from("competitor_analyses").update({ status: "error" }).eq("id", id)
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    // Update the analysis with the AI-generated content
    const { data: updatedAnalysis, error: updateError } = await supabase
      .from("competitor_analyses")
      .update({
        status: "completed",
        summary: aiAnalysis.summary,
        market_overview: aiAnalysis.market_overview,
        competitors: aiAnalysis.competitors,
        strengths_weaknesses: aiAnalysis.strengths_weaknesses,
        opportunities: aiAnalysis.opportunities,
        threats: aiAnalysis.threats,
        recommendations: aiAnalysis.recommendations,
        pricing_comparison: aiAnalysis.pricing_comparison,
        service_comparison: aiAnalysis.service_comparison,
        online_presence: aiAnalysis.online_presence,
        patient_reviews_analysis: aiAnalysis.patient_reviews_analysis,
        ai_analysis: {
          ...aiAnalysis,
          ratings_summary: aiAnalysis.ratings_summary,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json(updatedAnalysis)
  } catch (error) {
    console.error("Error generating competitor analysis:", error)
    return NextResponse.json({ error: "Failed to generate analysis" }, { status: 500 })
  }
}

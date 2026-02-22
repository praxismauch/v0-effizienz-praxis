import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateText } from "ai"

interface GooglePlace {
  name: string
  formatted_address: string
  rating?: number
  user_ratings_total?: number
  place_id: string
  business_status?: string
  types?: string[]
  geometry?: { location: { lat: number; lng: number } }
  opening_hours?: { open_now: boolean }
}

// Search for real medical practices using Google Places API
async function searchRealCompetitors(
  location: string,
  specialty: string,
  radiusKm: number,
  apiKey: string,
): Promise<GooglePlace[]> {
  try {
    // First geocode the location to get coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location + ", Deutschland")}&key=${apiKey}`
    const geocodeRes = await fetch(geocodeUrl)
    const geocodeData = await geocodeRes.json()

    if (!geocodeData.results?.length) {
      console.log("[v0] Geocoding failed for location:", location)
      return []
    }

    const { lat, lng } = geocodeData.results[0].geometry.location
    console.log(`[v0] Geocoded ${location} to ${lat}, ${lng}`)

    // Map German specialties to search terms
    const searchTerms: Record<string, string> = {
      "Allgemeinmedizin": "Hausarzt Allgemeinmedizin",
      "Innere Medizin": "Internist Innere Medizin",
      "Kardiologie": "Kardiologe",
      "Orthopädie": "Orthopäde",
      "Dermatologie": "Hautarzt Dermatologe",
      "Gynäkologie": "Frauenarzt Gynäkologe",
      "Pädiatrie": "Kinderarzt",
      "Zahnmedizin": "Zahnarzt",
      "Augenheilkunde": "Augenarzt",
      "HNO": "HNO Arzt",
      "Neurologie": "Neurologe",
      "Urologie": "Urologe",
      "Chirurgie": "Chirurg",
    }

    // Build search query
    let searchQuery = specialty
    for (const [de, term] of Object.entries(searchTerms)) {
      if (specialty.toLowerCase().includes(de.toLowerCase())) {
        searchQuery = term
        break
      }
    }

    // Search for nearby practices
    const radiusMeters = radiusKm * 1000
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery + " " + location)}&location=${lat},${lng}&radius=${radiusMeters}&type=doctor&language=de&key=${apiKey}`

    const searchRes = await fetch(searchUrl)
    const searchData = await searchRes.json()

    if (searchData.status === "OK" && searchData.results) {
      console.log(`[v0] Found ${searchData.results.length} real competitors via Google Places`)
      return searchData.results.slice(0, 10) // Limit to 10
    }

    console.log("[v0] Google Places search status:", searchData.status)
    return []
  } catch (error) {
    console.error("[v0] Google Places search error:", error)
    return []
  }
}

// Get the Google Places API key from practice settings or environment
async function getGoogleApiKey(supabase: ReturnType<typeof createAdminClient> extends Promise<infer T> ? T : never, practiceId: string): Promise<string | null> {
  // Try practice-level key first
  const { data: settings } = await supabase
    .from("practice_settings")
    .select("system_settings")
    .eq("practice_id", practiceId)
    .single()

  const practiceKey = settings?.system_settings?.google_places_api_key
  if (practiceKey) return practiceKey

  // Try super-admin API keys
  const { data: apiKeys } = await supabase
    .from("api_keys")
    .select("key_value")
    .eq("key_name", "google_places_api_key")
    .eq("is_active", true)
    .single()

  if (apiKeys?.key_value) return apiKeys.key_value

  // Fall back to environment variable
  return process.env.GOOGLE_PLACES_API_KEY || null
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

    // Try to fetch real competitor data from Google Places API
    const googleApiKey = await getGoogleApiKey(supabase, practiceId)
    let realCompetitors: GooglePlace[] = []
    let dataSource = "ai-generated"

    if (googleApiKey) {
      console.log("[v0] Google API key found, searching for real competitors...")
      realCompetitors = await searchRealCompetitors(
        analysis.location,
        analysis.specialty,
        analysis.radius_km || 10,
        googleApiKey,
      )
      if (realCompetitors.length > 0) {
        dataSource = "google-places"
        console.log(`[v0] Using ${realCompetitors.length} real competitors from Google Places`)
      }
    } else {
      console.log("[v0] No Google API key found, using AI-only generation")
    }

    // Build real competitor context for the prompt
    const realCompetitorContext = realCompetitors.length > 0
      ? `\n\nECHTE WETTBEWERBER (von Google Places API - verwende diese ECHTEN Daten als Basis):\n${realCompetitors
          .map(
            (p, i) =>
              `${i + 1}. "${p.name}" - ${p.formatted_address}${p.rating ? ` - Google ${p.rating}/5 (${p.user_ratings_total || 0} Bewertungen)` : ""}`,
          )
          .join("\n")}\n\nWICHTIG: Verwende exakt die oben genannten echten Praxisnamen und Adressen! Ergänze die Daten mit deiner Analyse (Stärken, Schwächen, etc.) aber erfinde KEINE neuen Praxisnamen.`
      : `\nHINWEIS: Es stehen KEINE Google-Places-Daten zur Verfügung. Du darfst KEINE fiktiven Wettbewerber erfinden! Setze "competitors" auf ein leeres Array []. Erstelle NUR die Marktanalyse, SWOT, Empfehlungen und Service-Vergleich basierend auf allgemeinem Marktwissen für ${analysis.location}.`

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
${realCompetitorContext}

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
- Wenn ECHTE Wettbewerber-Daten von Google Places vorliegen: Verwende NUR diese echten Daten. Erfinde KEINE zusätzlichen Praxen.
- Wenn KEINE Google-Places-Daten vorliegen: Setze "competitors" auf ein LEERES Array []. Erfinde NIEMALS fiktive Praxisnamen, Adressen oder Bewertungen!
- Die Google-Bewertungen (nur bei echten Daten) sollten die realen Werte verwenden (typisch 3.5-4.8 Sterne)
- Jameda verwendet eine Notenskala von 1.0 (beste) bis 6.0 (schlechteste)
- Alle Analysen müssen spezifisch für die Fachrichtung "${analysis.specialty}" sein
- Gib konkrete, umsetzbare Empfehlungen auch wenn keine Wettbewerber-Daten vorliegen
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

    // SAFETY: If no real Google Places data, force competitors to empty array
    // to prevent AI from hallucinating fake practices
    if (dataSource !== "google-places") {
      aiAnalysis.competitors = []
      console.log("[v0] No Google Places data - cleared AI-generated competitors to prevent hallucination")
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
          data_source: dataSource,
          real_competitor_count: realCompetitors.length,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    // Trigger cover image generation in the background (non-blocking)
    try {
      const baseUrl = request.nextUrl.origin
      fetch(`${baseUrl}/api/practices/${practiceId}/competitor-analysis/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: id,
          location: analysis.location,
          specialty: analysis.specialty,
        }),
      }).catch((err) => console.error("Background image generation failed:", err))
    } catch (imgErr) {
      // Non-critical - don't fail the analysis if image gen fails
      console.error("Error triggering image generation:", imgErr)
    }

    return NextResponse.json(updatedAnalysis)
  } catch (error) {
    console.error("Error generating competitor analysis:", error)
    return NextResponse.json({ error: "Failed to generate analysis" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createAdminClient } from "@/lib/supabase/server"
import { checkAIEnabled } from "@/lib/check-ai-enabled"

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, fileName, fileType, practiceId } = await request.json()

    if (!fileUrl || !fileName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (practiceId) {
      const supabase = await createAdminClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { enabled: aiEnabled, isSuperAdmin } = await checkAIEnabled(practiceId, user.id)

      if (!aiEnabled && !isSuperAdmin) {
        return NextResponse.json(
          {
            error: "KI-Funktionen sind für diese Praxis deaktiviert",
            details: "Die KI-Dokumentenanalyse wurde vom Administrator deaktiviert.",
          },
          { status: 403 },
        )
      }
    }

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `Analysiere dieses Dokument detailliert und erstelle eine umfassende Analyse auf Deutsch.

Dokument: ${fileName}
Typ: ${fileType}

Antworte NUR mit einem JSON-Objekt (kein Markdown, keine Code-Blöcke, kein zusätzlicher Text) mit dieser Struktur:
{
  "summary": "kurze Zusammenfassung hier",
  "documentType": "Dokumenttyp (z.B. Rechnung, Vertrag, Bericht, etc.)",
  "keyPoints": ["Wichtiger Punkt 1", "Wichtiger Punkt 2", "Wichtiger Punkt 3"],
  "categories": ["Kategorie1", "Kategorie2"],
  "tags": ["Tag1", "Tag2", "Tag3"],
  "detectedEntities": {
    "dates": ["gefundene Daten"],
    "amounts": ["gefundene Beträge"],
    "names": ["gefundene Namen"]
  },
  "recommendations": ["Empfehlung 1", "Empfehlung 2"],
  "relevanceScore": 8
}

Wichtig: 
- Alle Texte sollen auf Deutsch sein
- Verwende präzise, professionelle deutsche Begriffe
- relevanceScore ist eine Zahl von 1-10
- Wenn keine Entitäten gefunden werden, gib leere Arrays zurück`,
    })

    let cleanText = text.trim()
    cleanText = cleanText.replace(/^```(?:json|JSON)?\s*\n?/gm, "")
    cleanText = cleanText.replace(/\n?```\s*$/gm, "")
    cleanText = cleanText.trim()

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanText = jsonMatch[0].trim()
    }

    let analysis
    try {
      analysis = JSON.parse(cleanText)
    } catch (parseError) {
      console.error("Analyze API - JSON parse failed:", parseError)

      analysis = {
        summary: `Document: ${fileName}. AI analysis temporarily unavailable.`,
        documentType: "Unbekannt",
        keyPoints: [],
        categories: ["Uncategorized"],
        tags: [fileType.split("/")[1] || "document"],
        detectedEntities: { dates: [], amounts: [], names: [] },
        recommendations: [],
        relevanceScore: 5,
      }
    }

    const result = {
      summary: analysis.summary || "Keine Zusammenfassung verfügbar",
      documentType: analysis.documentType || "Unbekannt",
      keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints : [],
      categories: Array.isArray(analysis.categories) ? analysis.categories : [],
      tags: Array.isArray(analysis.tags) ? analysis.tags : [],
      detectedEntities: {
        dates: Array.isArray(analysis.detectedEntities?.dates) ? analysis.detectedEntities.dates : [],
        amounts: Array.isArray(analysis.detectedEntities?.amounts) ? analysis.detectedEntities.amounts : [],
        names: Array.isArray(analysis.detectedEntities?.names) ? analysis.detectedEntities.names : [],
      },
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
      relevanceScore: typeof analysis.relevanceScore === "number" ? analysis.relevanceScore : 5,
      analyzedAt: new Date().toISOString(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Analyze API - Error:", error)
    return NextResponse.json(
      { error: "Failed to analyze document", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

const RKI_SYSTEM_PROMPT = `Du bist ein Experte für Hygiene und Infektionsprävention mit tiefem Wissen über die Richtlinien des Robert Koch-Instituts (RKI).

Deine Aufgabe ist es, professionelle Hygienepläne für medizinische Praxen zu erstellen, die:
- Den aktuellen RKI-Empfehlungen entsprechen
- Praxistauglich und verständlich formuliert sind
- Konkrete Schritt-für-Schritt-Anleitungen enthalten
- Die erforderlichen Produkte und Materialien benennen
- Relevante RKI-Referenzen angeben

Erstelle Hygienepläne, die rechtssicher sind und best practices in der Infektionsprävention widerspiegeln.`

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ practiceId: string }> },
) {
  const { practiceId } = await context.params
  const supabase = await createClient()

  try {
    const body = await request.json()
    const { plan_type, area } = body

    if (!plan_type || !area) {
      return NextResponse.json(
        { error: "plan_type and area are required" },
        { status: 400 },
      )
    }

    // Generate hygiene plan using AI
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: RKI_SYSTEM_PROMPT,
      maxOutputTokens: 1500,
      temperature: 0.7,
      prompt: `Erstelle einen detaillierten Hygieneplan für eine medizinische Praxis mit folgenden Anforderungen:

Typ: ${plan_type}
Bereich: ${area}

Bitte generiere:
1. Einen passenden Titel
2. Eine detaillierte Schritt-für-Schritt-Anleitung zur Durchführung
3. Eine Liste der benötigten Produkte/Materialien
4. Relevante RKI-Referenzen oder Richtlinien

Formatiere die Antwort als JSON mit folgender Struktur:
{
  "title": "Titel des Hygieneplans",
  "procedure": "Detaillierte Durchführungsanleitung mit nummerierten Schritten",
  "products_used": ["Produkt 1", "Produkt 2", "..."],
  "rki_reference": "Link oder Referenz zur RKI-Richtlinie"
}`,
    })

    // Parse AI response
    let parsedData
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      // Fallback: create structured data from text
      parsedData = {
        title: `Hygieneplan: ${plan_type} - ${area}`,
        procedure: text,
        products_used: [],
        rki_reference: "Bitte RKI-Richtlinien für weitere Details konsultieren",
      }
    }

    return NextResponse.json(parsedData)
  } catch (error: any) {
    console.error("Error generating RKI plan:", error)
    return NextResponse.json(
      { error: "Failed to generate plan", details: error.message },
      { status: 500 },
    )
  }
}

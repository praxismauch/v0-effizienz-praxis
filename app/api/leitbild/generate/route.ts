import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 })
    }

    const { practiceId, responses } = body

    if (!practiceId || !responses) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: practice, error: practiceError } = await supabase
      .from("practices")
      .select("name, type")
      .eq("id", practiceId)
      .single()

    if (practiceError) {
      console.error("Error fetching practice:", practiceError)
      return NextResponse.json({ error: "Practice not found" }, { status: 404 })
    }

    const prompt = `Du bist ein Experte für Unternehmenskultur und Mission Statements im Gesundheitswesen.
    
Basierend auf folgenden Antworten einer medizinischen Praxis, erstelle bitte:
1. Ein professionelles Mission Statement (4-6 Sätze mit detaillierten Erklärungen)
2. Ein Vision Statement (4-6 Sätze mit konkreten Zukunftszielen)
3. Ein Leitbild als Ein-Satz-Zusammenfassung (maximal 20 Wörter)

Praxis: ${practice?.name || "Unbekannt"}
Praxistyp: ${practice?.type || "Unbekannt"}

Antworten:
1. Kernwerte: ${responses.core_values}
2. Patienten-Fokus: ${responses.patient_focus}
3. Alleinstellungsmerkmal: ${responses.unique_approach}
4. Zukunftsvision: ${responses.future_vision}
5. Gesellschaftlicher Beitrag: ${responses.impact}

Wichtig:
- Verwende professionelle, aber authentische Sprache
- Sei konkret und vermeide Floskeln
- Das Mission Statement sollte erklären: Wer wir sind, was wir tun, für wen, und warum es wichtig ist
- Das Vision Statement sollte beschreiben: Unsere langfristigen Ziele, wie wir die Zukunft gestalten wollen, und welchen Einfluss wir haben möchten
- Das Leitbild soll inspirierend und einprägsam sein
- Alle Texte sollten auf Deutsch sein und ausführlich genug sein, um echten Wert zu vermitteln

Antworte im folgenden JSON-Format:
{
  "mission": "...",
  "vision": "...",
  "leitbild": "..."
}`

    let generated
    try {
      const { text } = await generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        prompt,
        temperature: 0.7,
      })

      try {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)
        const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text
        generated = JSON.parse(jsonText)

        if (!generated.mission || !generated.vision || !generated.leitbild) {
          throw new Error("AI response missing required fields")
        }
      } catch (parseError) {
        console.error("Failed to parse AI response")
        throw new Error("Fehler beim Verarbeiten der KI-Antwort")
      }
    } catch (aiError: any) {
      console.error("AI generation failed:", aiError)

      generated = {
        mission: `Wir bei ${practice?.name || "unserer Praxis"} setzen uns täglich für das Wohlbefinden unserer Patienten ein. ${responses.core_values ? `Unsere Arbeit basiert auf den Werten: ${responses.core_values}.` : ""} ${responses.patient_focus ? `Unser Fokus liegt auf ${responses.patient_focus}.` : ""} ${responses.unique_approach ? `Was uns besonders macht: ${responses.unique_approach}.` : ""}`,
        vision: `Unsere Vision für die Zukunft: ${responses.future_vision || "Wir streben danach, unsere Praxis kontinuierlich weiterzuentwickeln."} ${responses.impact ? `Wir möchten einen positiven Beitrag leisten durch: ${responses.impact}.` : ""}`,
        leitbild: `${practice?.name || "Unsere Praxis"}: ${responses.unique_approach?.substring(0, 50) || "Qualität und Menschlichkeit im Fokus"}`,
      }
    }

    return NextResponse.json(generated)
  } catch (error: any) {
    console.error("Error generating leitbild:", error)
    return NextResponse.json(
      {
        error: error.message || "Interner Server-Fehler",
        details: process.env.NODE_ENV === "development" ? error.toString() : undefined,
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const body = await request.json()
    const supabase = await createAdminClient()

    const dimensions = {
      energy_level: body.energy_level,
      stress_level: body.stress_level,
      work_satisfaction: body.work_satisfaction,
      team_harmony: body.team_harmony,
      work_life_balance: body.work_life_balance,
      motivation: body.motivation,
      overall_wellbeing: body.overall_wellbeing,
    }

    // Find lowest scoring dimensions
    const sortedDimensions = Object.entries(dimensions)
      .filter(([_, value]) => value !== null && value !== undefined)
      .sort(([, a], [, b]) => {
        // For stress_level, higher is worse
        const aVal = a === "stress_level" ? 11 - (a as number) : (a as number)
        const bVal = b === "stress_level" ? 11 - (b as number) : (b as number)
        return aVal - bVal
      })

    const dimensionLabels: Record<string, string> = {
      energy_level: "Energielevel",
      stress_level: "Stresslevel",
      work_satisfaction: "Arbeitszufriedenheit",
      team_harmony: "Team-Harmonie",
      work_life_balance: "Work-Life-Balance",
      motivation: "Motivation",
      overall_wellbeing: "Allgemeines Wohlbefinden",
    }

    const prompt = `Du bist ein professioneller Wellness-Coach für medizinisches Fachpersonal in einer Arztpraxis.

Basierend auf der folgenden Selbsteinschätzung eines Mitarbeiters, erstelle 3-5 konkrete, umsetzbare Empfehlungen zur Verbesserung des mentalen Wohlbefindens.

Selbsteinschätzung (Skala 1-10, höher ist besser, außer Stress wo niedriger besser ist):
${Object.entries(dimensions)
  .filter(([_, v]) => v !== null && v !== undefined)
  .map(([key, value]) => `- ${dimensionLabels[key]}: ${value}/10`)
  .join("\n")}

Die niedrigsten Werte sind:
${sortedDimensions
  .slice(0, 3)
  .map(([key, value]) => `- ${dimensionLabels[key]}: ${value}/10`)
  .join("\n")}

Erstelle deine Empfehlungen im folgenden JSON-Format:
{
  "recommendations": [
    {
      "dimension": "energy_level|stress_level|work_satisfaction|team_harmony|work_life_balance|motivation|overall_wellbeing",
      "title": "Kurzer, prägnanter Titel",
      "description": "Detaillierte, praktische Empfehlung (2-3 Sätze)",
      "priority": "high|medium|low",
      "actionable_steps": ["Schritt 1", "Schritt 2", "Schritt 3"]
    }
  ],
  "overall_assessment": "Eine kurze Gesamteinschätzung des mentalen Wohlbefindens (2-3 Sätze)",
  "encouragement": "Eine motivierende, ermutigende Nachricht"
}

Antworte NUR mit dem JSON, ohne zusätzlichen Text.`

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
    })

    // Parse the JSON response
    let recommendations
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text]
      recommendations = JSON.parse(jsonMatch[1] || text)
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      recommendations = {
        recommendations: [],
        overall_assessment: "Die KI-Analyse konnte nicht durchgeführt werden.",
        encouragement: "Bleiben Sie positiv und achten Sie auf Ihr Wohlbefinden.",
      }
    }

    // Update the self-check with AI recommendations
    if (body.assessment_id) {
      await supabase
        .from("user_self_checks")
        .update({
          ai_recommendations: recommendations,
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.assessment_id)
    }

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error("Error generating AI recommendations:", error)
    return NextResponse.json(
      {
        recommendations: [],
        overall_assessment: "Ein Fehler ist aufgetreten.",
        encouragement: "Bitte versuchen Sie es später erneut.",
      },
      { status: 500 },
    )
  }
}

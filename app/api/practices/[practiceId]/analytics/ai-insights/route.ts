import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const supabase = await createClient()
    const { practiceId } = await params

    const { data: analyticsData } = await supabase
      .from("parameter_values")
      .select("*, parameter:parameters(*)")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })
      .limit(100)

    const { text } = await generateText({
      model: "openai/gpt-4o",
      prompt: `Analysiere die folgenden Parameter-Daten einer Arztpraxis und erkenne Trends, Anomalien und Vorhersagen:

Parameter-Daten: ${JSON.stringify(analyticsData?.slice(0, 20))}

Gib die Antwort als JSON:
{
  "trends": [
    { "metric": "Parameter-Name", "description": "Trend-Beschreibung", "direction": "steigend/fallend/stabil" }
  ],
  "predictions": ["Vorhersage 1", "Vorhersage 2"],
  "anomalies": ["Anomalie 1", "Anomalie 2"],
  "recommendations": ["Empfehlung 1", "Empfehlung 2"]
}`,
    })

    const insights = JSON.parse(text)
    return Response.json(insights)
  } catch (error) {
    console.error("Error generating analytics insights:", error)
    return Response.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}

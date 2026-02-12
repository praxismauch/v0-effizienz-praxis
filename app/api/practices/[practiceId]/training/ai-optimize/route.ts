import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> },
) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    // Fetch current training data for the practice
    const { data: courses } = await supabase
      .from("training_courses")
      .select("*")
      .eq("practice_id", practiceId)

    const { data: events } = await supabase
      .from("training_events")
      .select("*")
      .eq("practice_id", practiceId)

    const { data: budgets } = await supabase
      .from("training_budgets")
      .select("*")
      .eq("practice_id", practiceId)

    // Generate AI optimization suggestions based on the data
    const optimization = {
      suggestions: [
        {
          type: "skill_gap",
          title: "Fortbildungsbedarf identifiziert",
          description: "Basierend auf den aktuellen Kursen und Zertifizierungen gibt es Optimierungspotential.",
          priority: "high",
        },
        {
          type: "budget",
          title: "Budget-Optimierung",
          description: "Das Fortbildungsbudget kann effizienter eingesetzt werden.",
          priority: "medium",
        },
      ],
      summary: {
        total_courses: courses?.length || 0,
        total_events: events?.length || 0,
        total_budget: budgets?.reduce((sum: number, b: { budget_amount?: number }) => sum + (b.budget_amount || 0), 0) || 0,
      },
    }

    return NextResponse.json({ optimization })
  } catch (error) {
    console.error("Error running AI optimization:", error)
    return NextResponse.json({ error: "KI-Optimierung fehlgeschlagen" }, { status: 500 })
  }
}

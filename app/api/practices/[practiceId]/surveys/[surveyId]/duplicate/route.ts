import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; surveyId: string }> },
) {
  try {
    const { practiceId, surveyId } = await params
    const supabase = await createClient()

    // Fetch original survey
    const { data: original, error: fetchError } = await supabase
      .from("surveys")
      .select("*")
      .eq("id", surveyId)
      .eq("practice_id", practiceId)
      .single()

    if (fetchError || !original) {
      return NextResponse.json({ error: "Umfrage nicht gefunden" }, { status: 404 })
    }

    // Create duplicate
    const { id: _id, created_at: _ca, updated_at: _ua, ...surveyData } = original
    const { data: duplicate, error: insertError } = await supabase
      .from("surveys")
      .insert({
        ...surveyData,
        title: `${original.title} (Kopie)`,
        status: "draft",
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Duplicate questions
    const { data: questions } = await supabase
      .from("survey_questions")
      .select("*")
      .eq("survey_id", surveyId)
      .order("order_index", { ascending: true })

    if (questions && questions.length > 0 && duplicate) {
      const duplicatedQuestions = questions.map(({ id: _qid, created_at: _qca, survey_id: _sid, ...q }) => ({
        ...q,
        survey_id: duplicate.id,
      }))

      await supabase.from("survey_questions").insert(duplicatedQuestions)
    }

    return NextResponse.json(duplicate)
  } catch (error) {
    console.error("Error duplicating survey:", error)
    return NextResponse.json({ error: "Fehler beim Duplizieren" }, { status: 500 })
  }
}

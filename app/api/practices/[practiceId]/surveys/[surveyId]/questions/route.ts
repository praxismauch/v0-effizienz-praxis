import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

async function getQueryClient() {
  const isV0Preview =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    process.env.NODE_ENV === "development" ||
    !process.env.NEXT_PUBLIC_VERCEL_ENV

  if (isV0Preview) {
    return createAdminClient()
  }
  return await createClient()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; surveyId: string }> },
) {
  try {
    const { surveyId } = await params
    const supabase = await getQueryClient()

    const { data: questions, error } = await supabase
      .from("survey_questions")
      .select("*")
      .eq("survey_id", surveyId)
      .order("order_index", { ascending: true })

    if (error) {
      console.error("Error fetching survey questions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ questions: questions || [] })
  } catch (error) {
    console.error("Error in GET survey questions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; surveyId: string }> },
) {
  try {
    const { surveyId } = await params
    const supabase = await getQueryClient()
    const body = await request.json()
    const { questions } = body

    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: "questions must be an array" }, { status: 400 })
    }

    // Delete existing questions
    const { error: deleteError } = await supabase
      .from("survey_questions")
      .delete()
      .eq("survey_id", surveyId)

    if (deleteError) {
      console.error("Error deleting old questions:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Insert new questions
    if (questions.length > 0) {
      const questionsToInsert = questions.map((q: Record<string, unknown>, i: number) => ({
        survey_id: surveyId,
        question_text: q.question_text,
        question_type: q.question_type || "scale",
        options: q.options || [],
        is_required: q.is_required !== false,
        order_index: q.order_index || i + 1,
      }))

      const { error: insertError } = await supabase
        .from("survey_questions")
        .insert(questionsToInsert)

      if (insertError) {
        console.error("Error inserting questions:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    // Fetch updated questions
    const { data: updatedQuestions } = await supabase
      .from("survey_questions")
      .select("*")
      .eq("survey_id", surveyId)
      .order("order_index", { ascending: true })

    return NextResponse.json({ questions: updatedQuestions || [] })
  } catch (error) {
    console.error("Error in PUT survey questions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

let _supabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error("Supabase not configured")
    _supabase = createClient(url, key, { auth: { persistSession: false } })
  }
  return _supabase
}
const supabase = new Proxy({} as ReturnType<typeof createClient>, { get: (_, prop) => (getSupabase() as any)[prop] })

interface QuizQuestion {
  id?: string
  display_order?: number
  options?: QuizOption[]
  [key: string]: unknown
}

interface QuizOption {
  id?: string
  display_order?: number
  [key: string]: unknown
}

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string; quizId: string }> }) {
  try {
    const { quizId } = await params

    const { data: quiz, error } = await supabase
      .from("academy_quizzes")
      .select(`
        *,
        academy_quiz_questions (
          *,
          academy_quiz_options (*)
        )
      `)
      .eq("id", quizId)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("Error fetching quiz:", error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    // Sort questions and options
    const sortedQuiz = {
      ...quiz,
      academy_quiz_questions: quiz.academy_quiz_questions
        ?.sort((a: QuizQuestion, b: QuizQuestion) => (a.display_order || 0) - (b.display_order || 0))
        .map((question: QuizQuestion) => ({
          ...question,
          academy_quiz_options: question.academy_quiz_options?.sort(
            (a: QuizOption, b: QuizOption) => (a.display_order || 0) - (b.display_order || 0),
          ),
        })),
    }

    return NextResponse.json({ quiz: sortedQuiz })
  } catch (error) {
    console.error("Unexpected error in GET quiz:", error)
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ practiceId: string; quizId: string }> }) {
  try {
    const { quizId } = await params
    const body = await request.json()
    const { questions, ...quizData } = body

    // Update quiz
    const { data: quiz, error: quizError } = await supabase
      .from("academy_quizzes")
      .update({
        ...quizData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quizId)
      .select()
      .single()

    if (quizError) {
      console.error("Error updating quiz:", quizError)
      return NextResponse.json({ error: quizError.message }, { status: 500 })
    }

    // Handle questions update if provided
    if (questions) {
      // Get existing questions
      const { data: existingQuestions } = await supabase
        .from("academy_quiz_questions")
        .select("id")
        .eq("quiz_id", quizId)

      const existingIds = existingQuestions?.map((q: { id: string }) => q.id) || []
      const providedIds = questions.filter((q: QuizQuestion) => q.id).map((q: QuizQuestion) => q.id)

      // Delete removed questions
      const toDelete = existingIds.filter((id: string) => !providedIds.includes(id))
      if (toDelete.length > 0) {
        await supabase.from("academy_quiz_questions").delete().in("id", toDelete)
      }

      // Update or create questions
      for (const question of questions) {
        const { options, id, ...questionData } = question

        if (id) {
          // Update existing question
          const { error: questionError } = await supabase
            .from("academy_quiz_questions")
            .update({
              ...questionData,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id)

          if (questionError) {
            console.error("Error updating question:", questionError)
            continue
          }

          // Handle options for existing question
          if (options) {
            const { data: existingOptions } = await supabase
              .from("academy_quiz_options")
              .select("id")
              .eq("question_id", id)

            const existingOptionIds = existingOptions?.map((o: { id: string }) => o.id) || []
            const providedOptionIds = options.filter((o: QuizOption) => o.id).map((o: QuizOption) => o.id)

            // Delete removed options
            const optionsToDelete = existingOptionIds.filter((oid: string) => !providedOptionIds.includes(oid))
            if (optionsToDelete.length > 0) {
              await supabase.from("academy_quiz_options").delete().in("id", optionsToDelete)
            }

            // Update or create options
            for (const option of options) {
              const { id: optionId, ...optionData } = option

              if (optionId) {
                await supabase
                  .from("academy_quiz_options")
                  .update({
                    ...optionData,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", optionId)
              } else {
                await supabase.from("academy_quiz_options").insert({
                  ...optionData,
                  question_id: id,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
              }
            }
          }
        } else {
          // Create new question
          const { data: newQuestion, error: questionError } = await supabase
            .from("academy_quiz_questions")
            .insert({
              ...questionData,
              quiz_id: quizId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (questionError) {
            console.error("Error creating question:", questionError)
            continue
          }

          // Create options for new question
          if (options && options.length > 0) {
            const optionsToInsert = options.map((opt: QuizOption) => ({
              ...opt,
              question_id: newQuestion.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))

            await supabase.from("academy_quiz_options").insert(optionsToInsert)
          }
        }
      }
    }

    // Fetch complete updated quiz
    const { data: completeQuiz } = await supabase
      .from("academy_quizzes")
      .select(`
        *,
        academy_quiz_questions (
          *,
          academy_quiz_options (*)
        )
      `)
      .eq("id", quizId)
      .single()

    return NextResponse.json({ quiz: completeQuiz || quiz })
  } catch (error) {
    console.error("Unexpected error in PUT quiz:", error)
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; quizId: string }> },
) {
  try {
    const { quizId } = await params

    // Soft delete quiz
    const { error } = await supabase
      .from("academy_quizzes")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", quizId)

    if (error) {
      console.error("Error deleting quiz:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error in DELETE quiz:", error)
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 })
  }
}

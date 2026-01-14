import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string; quizId: string }> }) {
  try {
    const { practiceId, quizId } = await params

    console.log("[v0] GET quiz by ID:", quizId)

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
      console.error("[v0] Error fetching quiz:", error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    // Sort questions and options
    const sortedQuiz = {
      ...quiz,
      academy_quiz_questions: quiz.academy_quiz_questions
        ?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map((question) => ({
          ...question,
          academy_quiz_options: question.academy_quiz_options?.sort(
            (a, b) => (a.display_order || 0) - (b.display_order || 0),
          ),
        })),
    }

    console.log("[v0] Quiz fetched successfully")

    return NextResponse.json({ quiz: sortedQuiz })
  } catch (error) {
    console.error("[v0] Unexpected error in GET quiz:", error)
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ practiceId: string; quizId: string }> }) {
  try {
    const { practiceId, quizId } = await params
    const body = await request.json()
    const { questions, ...quizData } = body

    console.log("[v0] PUT quiz:", quizId)

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
      console.error("[v0] Error updating quiz:", quizError)
      return NextResponse.json({ error: quizError.message }, { status: 500 })
    }

    console.log("[v0] Quiz updated successfully")

    // Handle questions update if provided
    if (questions) {
      // Get existing questions
      const { data: existingQuestions } = await supabase
        .from("academy_quiz_questions")
        .select("id")
        .eq("quiz_id", quizId)

      const existingIds = existingQuestions?.map((q) => q.id) || []
      const providedIds = questions.filter((q: any) => q.id).map((q: any) => q.id)

      // Delete removed questions
      const toDelete = existingIds.filter((id) => !providedIds.includes(id))
      if (toDelete.length > 0) {
        await supabase.from("academy_quiz_questions").delete().in("id", toDelete)
        console.log("[v0] Deleted questions:", toDelete.length)
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
            console.error("[v0] Error updating question:", questionError)
            continue
          }

          // Handle options for existing question
          if (options) {
            const { data: existingOptions } = await supabase
              .from("academy_quiz_options")
              .select("id")
              .eq("question_id", id)

            const existingOptionIds = existingOptions?.map((o) => o.id) || []
            const providedOptionIds = options.filter((o: any) => o.id).map((o: any) => o.id)

            // Delete removed options
            const optionsToDelete = existingOptionIds.filter((oid) => !providedOptionIds.includes(oid))
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
            console.error("[v0] Error creating question:", questionError)
            continue
          }

          // Create options for new question
          if (options && options.length > 0) {
            const optionsToInsert = options.map((opt: any) => ({
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

    console.log("[v0] Quiz updated with all nested data")

    return NextResponse.json({ quiz: completeQuiz || quiz })
  } catch (error) {
    console.error("[v0] Unexpected error in PUT quiz:", error)
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; quizId: string }> },
) {
  try {
    const { practiceId, quizId } = await params

    console.log("[v0] DELETE quiz:", quizId)

    // Soft delete quiz (questions and options will cascade or be handled separately)
    const { error } = await supabase
      .from("academy_quizzes")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", quizId)

    if (error) {
      console.error("[v0] Error deleting quiz:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Quiz soft deleted successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Unexpected error in DELETE quiz:", error)
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 })
  }
}

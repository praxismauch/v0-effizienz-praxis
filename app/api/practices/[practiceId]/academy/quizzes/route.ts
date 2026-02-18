import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

interface QuizQuestion {
  options?: QuizOption[]
  [key: string]: unknown
}

interface QuizOption {
  [key: string]: unknown
}

interface Quiz {
  academy_quiz_questions?: (QuizQuestion & {
    display_order?: number
    academy_quiz_options?: (QuizOption & { display_order?: number })[]
  })[]
  [key: string]: unknown
}

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    await params
    const supabase = await createAdminClient()
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("course_id")
    const moduleId = searchParams.get("module_id")
    const lessonId = searchParams.get("lesson_id")

    let query = supabase
      .from("academy_quizzes")
      .select(`
        *,
        academy_quiz_questions (
          *,
          academy_quiz_options (*)
        )
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (courseId) {
      query = query.eq("course_id", courseId)
    }
    if (moduleId) {
      query = query.eq("module_id", moduleId)
    }
    if (lessonId) {
      query = query.eq("lesson_id", lessonId)
    }

    const { data: quizzes, error } = await query

    if (error) {
      console.error("Error fetching quizzes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sort questions and options by display_order
    const sortedQuizzes = (quizzes as Quiz[])?.map((quiz) => ({
      ...quiz,
      academy_quiz_questions: quiz.academy_quiz_questions
        ?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map((question) => ({
          ...question,
          academy_quiz_options: question.academy_quiz_options?.sort(
            (a, b) => (a.display_order || 0) - (b.display_order || 0),
          ),
        })),
    }))

    return NextResponse.json({ quizzes: sortedQuizzes || [] })
  } catch (error) {
    console.error("Unexpected error in GET quizzes:", error)
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    await params
    const supabase = await createAdminClient()
    const body = await request.json()
    const { questions, ...quizData } = body

    // Create quiz
    const { data: quiz, error: quizError } = await supabase
      .from("academy_quizzes")
      .insert({
        ...quizData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (quizError) {
      console.error("Error creating quiz:", quizError)
      return NextResponse.json({ error: quizError.message }, { status: 500 })
    }

    // Create questions and options if provided
    if (questions && questions.length > 0) {
      for (const question of questions as QuizQuestion[]) {
        const { options, ...questionData } = question

        const { data: createdQuestion, error: questionError } = await supabase
          .from("academy_quiz_questions")
          .insert({
            ...questionData,
            quiz_id: quiz.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (questionError) {
          console.error("Error creating question:", questionError)
          continue
        }

        // Create options if provided
        if (options && options.length > 0) {
          const optionsToInsert = options.map((opt: QuizOption) => ({
            ...opt,
            question_id: createdQuestion.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))

          const { error: optionsError } = await supabase.from("academy_quiz_options").insert(optionsToInsert)

          if (optionsError) {
            console.error("Error creating options:", optionsError)
          }
        }
      }
    }

    // Fetch complete quiz with questions and options
    const { data: completeQuiz } = await supabase
      .from("academy_quizzes")
      .select(`
        *,
        academy_quiz_questions (
          *,
          academy_quiz_options (*)
        )
      `)
      .eq("id", quiz.id)
      .single()

    return NextResponse.json({ quiz: completeQuiz || quiz }, { status: 201 })
  } catch (error) {
    console.error("Unexpected error in POST quiz:", error)
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 })
  }
}

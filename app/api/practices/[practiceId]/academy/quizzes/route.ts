import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

export async function GET(request: Request, { params }: { params: { practiceId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("course_id")
    const moduleId = searchParams.get("module_id")
    const lessonId = searchParams.get("lesson_id")

    console.log("[v0] GET /api/practices/[practiceId]/academy/quizzes - Start", {
      practiceId: params.practiceId,
      courseId,
      moduleId,
      lessonId,
    })

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

    // Filter by course/module/lesson
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
      console.error("[v0] Error fetching quizzes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sort questions and options by display_order
    const sortedQuizzes = quizzes?.map((quiz) => ({
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

    console.log("[v0] Fetched quizzes successfully:", sortedQuizzes?.length)

    return NextResponse.json({ quizzes: sortedQuizzes || [] })
  } catch (error) {
    console.error("[v0] Unexpected error in GET quizzes:", error)
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { practiceId: string } }) {
  try {
    const body = await request.json()
    const { questions, ...quizData } = body

    console.log("[v0] POST /api/practices/[practiceId]/academy/quizzes - Start", {
      practiceId: params.practiceId,
      quizData,
      questionsCount: questions?.length,
    })

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
      console.error("[v0] Error creating quiz:", quizError)
      return NextResponse.json({ error: quizError.message }, { status: 500 })
    }

    console.log("[v0] Quiz created successfully:", quiz.id)

    // Create questions and options if provided
    if (questions && questions.length > 0) {
      for (const question of questions) {
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
          console.error("[v0] Error creating question:", questionError)
          continue
        }

        console.log("[v0] Question created:", createdQuestion.id)

        // Create options if provided
        if (options && options.length > 0) {
          const optionsToInsert = options.map((opt: any) => ({
            ...opt,
            question_id: createdQuestion.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))

          const { error: optionsError } = await supabase.from("academy_quiz_options").insert(optionsToInsert)

          if (optionsError) {
            console.error("[v0] Error creating options:", optionsError)
          } else {
            console.log("[v0] Options created:", optionsToInsert.length)
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

    console.log("[v0] Quiz created with all nested data")

    return NextResponse.json({ quiz: completeQuiz || quiz }, { status: 201 })
  } catch (error) {
    console.error("[v0] Unexpected error in POST quiz:", error)
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 })
  }
}

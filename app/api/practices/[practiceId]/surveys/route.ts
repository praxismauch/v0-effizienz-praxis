import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await getQueryClient()

    const isV0Preview =
      process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
      process.env.NODE_ENV === "development" ||
      !process.env.NEXT_PUBLIC_VERCEL_ENV

    if (!isV0Preview) {
      const regularClient = await createClient()
      const {
        data: { user },
        error: userError,
      } = await regularClient.auth.getUser()
      if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const { data: surveys, error } = await supabase
      .from("surveys")
      .select(`
        *,
        questions:survey_questions(*)
      `)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching surveys:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ surveys: surveys || [] })
  } catch (error) {
    console.error("Error in GET /api/practices/[practiceId]/surveys:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await getQueryClient()

    const isV0Preview =
      process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
      process.env.NODE_ENV === "development" ||
      !process.env.NEXT_PUBLIC_VERCEL_ENV

    let userId = "00000000-0000-0000-0000-000000000000" // Fallback for v0 preview

    if (!isV0Preview) {
      const regularClient = await createClient()
      const {
        data: { user },
        error: userError,
      } = await regularClient.auth.getUser()
      if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      userId = user.id
    }

    const body = await request.json()
    const {
      title,
      description,
      survey_type,
      target_audience,
      is_anonymous,
      start_date,
      end_date,
      questions,
      notify_admin_on_response,
    } = body

    // Generate public token for external/anonymous surveys
    const publicToken =
      survey_type === "external" || survey_type === "anonymous" || target_audience === "patients"
        ? randomBytes(16).toString("hex")
        : null

    const surveyId = crypto.randomUUID()

    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .insert({
        id: surveyId,
        practice_id: practiceId,
        title,
        description,
        survey_type: survey_type || "internal",
        target_audience: target_audience || "all",
        is_anonymous: is_anonymous || false,
        start_date: start_date || null,
        end_date: end_date || null,
        public_token: publicToken,
        created_by: userId,
        status: "draft",
        notify_admin_on_response: notify_admin_on_response || false,
      })
      .select()
      .single()

    if (surveyError) {
      console.error("Error creating survey:", surveyError)
      return NextResponse.json({ error: surveyError.message }, { status: 500 })
    }

    // If questions are provided (from template), insert them
    if (questions && questions.length > 0) {
      const questionsToInsert = questions.map((q: any, index: number) => ({
        id: crypto.randomUUID(),
        survey_id: survey.id,
        question_text: q.question_text,
        question_type: q.question_type,
        is_required: q.is_required ?? true,
        display_order: index,
        options: q.options || [],
        min_value: q.min_value,
        max_value: q.max_value,
        scale_labels: q.scale_labels,
        placeholder: q.placeholder,
        help_text: q.help_text,
      }))

      const { error: questionsError } = await supabase.from("survey_questions").insert(questionsToInsert)

      if (questionsError) {
        console.error("Error creating questions:", questionsError)
      }
    }

    // If start_date or end_date is set, add to calendar
    if (start_date || end_date) {
      await supabase.from("calendar_events").insert({
        id: crypto.randomUUID(),
        practice_id: practiceId,
        title: `Umfrage: ${title}`,
        description: `Umfragezeitraum${start_date ? ` ab ${start_date}` : ""}${end_date ? ` bis ${end_date}` : ""}`,
        start_date: start_date || end_date,
        end_date: end_date || start_date,
        is_all_day: true,
        type: "survey",
        created_by: userId,
      })
    }

    return NextResponse.json({ survey })
  } catch (error) {
    console.error("Error in POST /api/practices/[practiceId]/surveys:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

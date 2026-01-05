import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const supabase = await createClient()

    const { data: survey, error } = await supabase
      .from("surveys")
      .select(`
        id,
        title,
        description,
        is_anonymous,
        show_progress,
        require_all_questions,
        thank_you_message,
        start_date,
        end_date,
        status,
        questions:survey_questions(
          id,
          question_text,
          question_type,
          is_required,
          display_order,
          options,
          min_value,
          max_value,
          scale_labels,
          placeholder,
          help_text
        )
      `)
      .eq("public_token", token)
      .is("deleted_at", null)
      .single()

    if (error || !survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    // Sort questions by display_order
    survey.questions = survey.questions?.sort((a: any, b: any) => a.display_order - b.display_order) || []

    return NextResponse.json({ survey })
  } catch (error) {
    console.error("Error fetching public survey:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

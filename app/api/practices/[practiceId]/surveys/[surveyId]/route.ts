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
    const { practiceId, surveyId } = await params
    const supabase = await getQueryClient()

    const { data: survey, error } = await supabase
      .from("surveys")
      .select(`
        *,
        questions:survey_questions(*)
      `)
      .eq("id", surveyId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("Error fetching survey:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ survey })
  } catch (error) {
    console.error("Error in GET survey:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; surveyId: string }> },
) {
  try {
    const { practiceId, surveyId } = await params
    const supabase = await getQueryClient()
    const body = await request.json()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Allow updating specific fields
    const allowedFields = [
      "title",
      "description",
      "status",
      "survey_type",
      "target_audience",
      "is_anonymous",
      "start_date",
      "end_date",
      "notify_admin_on_response",
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const { data: survey, error } = await supabase
      .from("surveys")
      .update(updateData)
      .eq("id", surveyId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("Error updating survey:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ survey })
  } catch (error) {
    console.error("Error in PATCH survey:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; surveyId: string }> },
) {
  try {
    const { practiceId, surveyId } = await params
    const supabase = await getQueryClient()

    // Soft delete
    const { error } = await supabase
      .from("surveys")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", surveyId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("Error deleting survey:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE survey:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

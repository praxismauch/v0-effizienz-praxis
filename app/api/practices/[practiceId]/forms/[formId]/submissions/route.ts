import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; formId: string }> },
) {
  try {
    const { practiceId, formId } = await params
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("form_submissions")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("form_id", formId)
      .order("submitted_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error fetching submissions:", error)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; formId: string }> },
) {
  try {
    const { practiceId, formId } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    const submittedBy = body.userId || body.user_id || body.submittedBy || body.submitted_by

    if (!submittedBy) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("form_submissions")
      .insert({
        practice_id: practiceId,
        form_id: formId,
        submitted_by: submittedBy,
        submission_data: body.data || body.submission_data,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error creating submission:", error)
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 })
  }
}

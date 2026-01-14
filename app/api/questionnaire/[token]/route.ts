import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { token } = await params

    const { data: response, error } = await supabase
      .from("questionnaire_responses")
      .select(
        `
        *,
        questionnaire:questionnaires(*),
        candidate:candidates(first_name, last_name, email)
      `,
      )
      .eq("token", token)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching questionnaire:", error)
      return NextResponse.json({ error: "Failed to fetch questionnaire" }, { status: 500 })
    }

    if (!response) {
      return NextResponse.json({ error: "Questionnaire not found" }, { status: 404 })
    }

    // Check if expired
    if (response.expires_at && new Date(response.expires_at) < new Date()) {
      return NextResponse.json({ error: "Questionnaire has expired" }, { status: 410 })
    }

    // Check if already completed
    if (response.status === "completed") {
      return NextResponse.json({ error: "Questionnaire already completed" }, { status: 410 })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Error fetching questionnaire:", error)
    return NextResponse.json({ error: "Failed to fetch questionnaire" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { token } = await params
    const body = await request.json()

    const { data, error } = await supabase
      .from("questionnaire_responses")
      .update({
        responses: body.responses,
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("token", token)
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] Error submitting questionnaire:", error)
      return NextResponse.json({ error: "Failed to submit questionnaire" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Questionnaire not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error submitting questionnaire:", error)
    return NextResponse.json({ error: "Failed to submit questionnaire" }, { status: 500 })
  }
}

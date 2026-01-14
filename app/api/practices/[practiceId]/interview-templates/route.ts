import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const supabase = await createAdminClient()

    const { data: templates, error } = await supabase
      .from("interview_templates")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(templates, {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[v0] Error fetching interview templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch interview templates" },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const body = await request.json()

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("interview_templates")
      .insert({
        practice_id: practiceId,
        name: body.name,
        description: body.description || "",
        content: body.content,
        category: body.category || "",
        is_default: body.is_default || false,
        created_by: body.created_by || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: `Database error: ${error.message}`, details: error },
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    return NextResponse.json(data, {
      status: 201,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[v0] Error creating interview template:", error)

    return NextResponse.json(
      {
        error: "Failed to create interview template",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}

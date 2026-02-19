import { getApiClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

function isRateLimitError(error: unknown): boolean {
  if (!error) return false
  const errorString = String(error)
  return (
    error instanceof SyntaxError ||
    errorString.includes("Too Many") ||
    errorString.includes("Unexpected token") ||
    errorString.includes("is not valid JSON")
  )
}

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await getApiClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ courses: [] })
      }
      throw err
    }

    const { data, error } = await supabase
      .from("training_courses")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("name")

    if (error) {
      if (isRateLimitError(error)) {
        return NextResponse.json({ courses: [] })
      }
      console.error("Error fetching courses:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ courses: data || [] })
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json({ courses: [] })
    }
    console.error("Error in courses GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const createdBy = body.created_by || body.createdBy || null

    let supabase
    try {
      supabase = await getApiClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
      }
      throw err
    }

    const { data, error } = await supabase
      .from("training_courses")
      .insert({
        practice_id: practiceId,
        name: body.name,
        title: body.title || body.name,
        description: body.description,
        provider: body.provider,
        category: body.category || "general",
        format: body.format || null,
        duration_hours: body.duration_hours || body.durationHours || null,
        cost: body.cost || null,
        url: body.url || null,
        is_online: body.is_online || body.isOnline || false,
        registration_url: body.registration_url || body.registrationUrl || null,
        is_mandatory: body.is_mandatory || body.isMandatory || false,
        is_active: true,
        created_by: createdBy,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating course:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ course: data })
  } catch (error) {
    console.error("Error in courses POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("team_id")

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await getApiClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ certifications: [] })
      }
      throw err
    }

    let query = supabase
      .from("certifications")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("name")

    if (teamId === "null" || teamId === "practice-wide") {
      query = query.is("team_id", null)
    } else if (teamId && teamId !== "all") {
      query = query.eq("team_id", teamId)
    }

    const { data, error } = await query

    if (error) {
      if (isRateLimitError(error)) {
        return NextResponse.json({ certifications: [] })
      }
      console.error("Error fetching certifications:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ certifications: data || [] })
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json({ certifications: [] })
    }
    console.error("Error in certifications GET:", error)
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

    const createdBy = body.created_by || body.createdBy
    if (!createdBy) {
      return NextResponse.json({ error: "created_by is required" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await getApiClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Zu viele Anfragen, bitte versuchen Sie es später erneut" }, { status: 429 })
      }
      throw err
    }

    const { data, error } = await supabase
      .from("certifications")
      .insert({
        practice_id: practiceId,
        name: body.name,
        description: body.description,
        category: body.category || "general",
        issuing_authority: body.issuing_authority || body.issuingAuthority || null,
        validity_months: body.validity_months || body.validityMonths || null,
        renewal_reminder_days: body.renewal_reminder_days || body.reminder_days_before || body.reminderDaysBefore || 30,
        is_mandatory: body.is_mandatory || body.isMandatory || false,
        icon: body.icon,
        color: body.color || "#3B82F6",
        team_id: body.team_id || body.teamId || null,
        created_by: createdBy,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating certification:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ certification: data })
  } catch (error) {
    console.error("Error in certifications POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { createAdminClient } from "@/lib/supabase/admin"
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
    const teamMemberId = searchParams.get("team_member_id")

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ team_member_certifications: [] })
      }
      throw err
    }

    let query = supabase
      .from("team_member_certifications")
      .select(`
        *,
        certification:certifications(*),
        team_member:team_members(id, first_name, last_name, role)
      `)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)

    if (teamMemberId) {
      query = query.eq("team_member_id", teamMemberId)
    }

    const { data, error } = await query.order("expiry_date", { ascending: true })

    if (error) {
      if (isRateLimitError(error)) {
        return NextResponse.json({ team_member_certifications: [] })
      }
      console.error("Error fetching team member certifications:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update status based on expiry dates
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const certificationsWithStatus = (data || []).map((cert) => {
      if (!cert.expiry_date) return { ...cert, status: "active" }

      const expiryDate = new Date(cert.expiry_date)
      if (expiryDate < now) {
        return { ...cert, status: "expired" }
      } else if (expiryDate < thirtyDaysFromNow) {
        return { ...cert, status: "expiring_soon" }
      }
      return { ...cert, status: "active" }
    })

    return NextResponse.json({ team_member_certifications: certificationsWithStatus })
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json({ team_member_certifications: [] })
    }
    console.error("Error in team member certifications GET:", error)
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

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Zu viele Anfragen, bitte versuchen Sie es später erneut" }, { status: 429 })
      }
      throw err
    }

    const { data, error } = await supabase
      .from("team_member_certifications")
      .insert({
        practice_id: practiceId,
        team_member_id: body.team_member_id,
        certification_id: body.certification_id,
        issue_date: body.issue_date,
        expiry_date: body.expiry_date,
        certificate_number: body.certificate_number,
        certificate_file_url: body.certificate_file_url,
        certificate_file_name: body.certificate_file_name,
        notes: body.notes,
        created_by: body.created_by,
      })
      .select(`
        *,
        certification:certifications(*),
        team_member:team_members(id, first_name, last_name, role)
      `)
      .single()

    if (error) {
      console.error("Error creating team member certification:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ team_member_certification: data })
  } catch (error) {
    console.error("Error in team member certifications POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

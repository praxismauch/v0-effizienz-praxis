import { createClient } from "@/lib/supabase/server"
import { getApiClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { safeSupabaseQuery } from "@/lib/supabase/safe-query"

// GET - Fetch all holiday requests for a practice
export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const year = searchParams.get("year") || new Date().getFullYear().toString()
    const teamMemberId = searchParams.get("teamMemberId")
    const status = searchParams.get("status")

    let query = supabase
      .from("holiday_requests")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .gte("start_date", `${year}-01-01`)
      .lte("end_date", `${year}-12-31`)
      .order("start_date", { ascending: true })

    if (teamMemberId) {
      query = query.eq("user_id", teamMemberId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const [requestsResult, blockedPeriodsResult, bankHolidaysResult] = await Promise.all([
      safeSupabaseQuery(() => query, []),
      safeSupabaseQuery(
        () =>
          supabase
            .from("holiday_blocked_periods")
            .select("*")
            .eq("practice_id", practiceId)
            .is("deleted_at", null)
            .gte("end_date", `${year}-01-01`)
            .lte("start_date", `${year}-12-31`),
        [],
      ),
      safeSupabaseQuery(
        () => supabase.from("holidays").select("*").eq("practice_id", practiceId).is("deleted_at", null),
        [],
      ),
    ])

    if (requestsResult.error && requestsResult.error.code !== "RATE_LIMITED") {
      console.error("Error fetching holiday requests:", requestsResult.error)
      return NextResponse.json({ error: "Failed to fetch holiday requests" }, { status: 500 })
    }

    return NextResponse.json({
      requests: requestsResult.data || [],
      blockedPeriods: blockedPeriodsResult.data || [],
      bankHolidays: bankHolidaysResult.data || [],
    })
  } catch (error) {
    console.error("Error in holiday requests GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new holiday request
export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    // Support both camelCase and snake_case field names from client
    const teamMemberId = body.teamMemberId || body.team_member_id
    const userId = body.userId || body.user_id
    const startDate = body.startDate || body.start_date
    const endDate = body.endDate || body.end_date
    const priority = body.priority
    const reason = body.reason
    const notes = body.notes
    const status = body.status

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start- und Enddatum sind Pflichtfelder" }, { status: 400 })
    }

    if (!(teamMemberId || userId)) {
      return NextResponse.json({ error: "Mitarbeiter muss ausgewählt werden" }, { status: 400 })
    }

    // Calculate days count (excluding weekends)
    const start = new Date(startDate)
    const end = new Date(endDate)
    let daysCount = 0
    const current = new Date(start)
    while (current <= end) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysCount++
      }
      current.setDate(current.getDate() + 1)
    }

    // Use admin client (bypasses RLS) with fallback to session client
    console.log("[v0] Holiday POST: creating request for practice=", practiceId, "user=", teamMemberId || userId, "dates=", startDate, "->", endDate)
    const client = await getApiClient()

    const { data, error } = await client
      .from("holiday_requests")
      .insert({
        practice_id: practiceId,
        user_id: teamMemberId || userId,
        start_date: startDate,
        end_date: endDate,
        days_count: daysCount,
        priority: priority || 1,
        reason: reason || null,
        notes: notes || null,
        status: status || "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating holiday request:", error)
      return NextResponse.json({ error: `Fehler beim Erstellen: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ request: data })
  } catch (error) {
    console.error("[v0] Error in holiday request POST:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

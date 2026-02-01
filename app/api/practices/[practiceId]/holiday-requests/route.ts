import { createClient, createAdminClient } from "@/lib/supabase/server"
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
      .select(`
        *,
        team_member:team_members(
          id, first_name, last_name, user_id,
          user:users(id, name, first_name, last_name, avatar)
        )
      `)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .gte("start_date", `${year}-01-01`)
      .lte("end_date", `${year}-12-31`)
      .order("start_date", { ascending: true })

    if (teamMemberId) {
      query = query.eq("team_member_id", teamMemberId)
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
    const supabase = await createClient()
    const body = await request.json()

    // Verify the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const { teamMemberId, userId, startDate, endDate, priority, reason, notes, status } = body

    if (!teamMemberId || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
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

    const adminClient = await createAdminClient()

    const { data, error } = await adminClient
      .from("holiday_requests")
      .insert({
        practice_id: practiceId,
        team_member_id: teamMemberId,
        user_id: userId || user.id,
        start_date: startDate,
        end_date: endDate,
        days_count: daysCount,
        priority: priority || 1,
        reason,
        notes,
        status: status || "wish",
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating holiday request:", error)
      return NextResponse.json({ error: "Failed to create holiday request" }, { status: 500 })
    }

    return NextResponse.json({ request: data })
  } catch (error) {
    console.error("Error in holiday request POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

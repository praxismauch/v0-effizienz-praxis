import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { safeSupabaseQuery } from "@/lib/supabase/safe-query"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const userId = searchParams.get("userId")
    const status = searchParams.get("status")
    const year = searchParams.get("year")
    const month = searchParams.get("month")

    let query = supabase
      .from("sick_leaves")
      .select(`
        *,
        team_member:team_members(id, first_name, last_name)
      `)
      .eq("practice_id", String(practiceId))
      .is("deleted_at", null)
      .order("start_date", { ascending: false })

    if (userId) {
      query = query.eq("user_id", String(userId))
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (year) {
      const startOfYear = `${year}-01-01`
      const endOfYear = `${year}-12-31`
      query = query.gte("start_date", startOfYear).lte("start_date", endOfYear)
    }

    if (month && year) {
      const startOfMonth = `${year}-${month.padStart(2, "0")}-01`
      const lastDay = new Date(Number(year), Number(month), 0).getDate()
      const endOfMonth = `${year}-${month.padStart(2, "0")}-${lastDay}`
      query = query.gte("start_date", startOfMonth).lte("start_date", endOfMonth)
    }

    const { data, error } = await safeSupabaseQuery(() => query, [])

    if (error && error.code !== "RATE_LIMITED") {
      console.error("sick-leaves GET error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate total sick days for each record
    const sickLeavesWithDays = (data || []).map((record: any) => {
      const start = new Date(record.start_date)
      const end = new Date(record.end_date)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      return { ...record, total_days: diffDays }
    })

    return NextResponse.json({ sickLeaves: sickLeavesWithDays })
  } catch (error) {
    console.error("sick-leaves GET exception:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const body = await request.json()

    const userId = body.user_id || body.userId
    const createdBy = body.created_by || body.createdBy

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 })
    }

    if (!createdBy) {
      return NextResponse.json({ error: "created_by is required" }, { status: 400 })
    }

    if (!body.start_date || !body.end_date) {
      return NextResponse.json({ error: "start_date and end_date are required" }, { status: 400 })
    }

    const sickLeaveData = {
      practice_id: String(practiceId),
      user_id: String(userId),
      team_member_id: body.team_member_id ? String(body.team_member_id) : null,
      start_date: body.start_date,
      end_date: body.end_date,
      reason: body.reason || null,
      notes: body.notes || null,
      status: body.status || "pending",
      document_url: body.document_url || null,
      created_by: String(createdBy),
    }

    const { data, error } = await supabase
      .from("sick_leaves")
      .insert(sickLeaveData)
      .select(`
        *,
        team_member:team_members(id, first_name, last_name)
      `)
      .single()

    if (error) {
      console.error("sick-leaves POST error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sickLeave: data })
  } catch (error) {
    console.error("sick-leaves POST exception:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

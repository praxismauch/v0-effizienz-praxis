import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")
    const supabase = await createClient()

    let query = supabase
      .from("shift_schedules")
      .select("*")
      .eq("practice_id", practiceId)
      .neq("status", "cancelled")
      .order("shift_date")
      .order("start_time")

    if (start) {
      query = query.gte("shift_date", start)
    }
    if (end) {
      query = query.lte("shift_date", end)
    }

    const { data: schedules, error } = await query

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ schedules: [] })
      }
      throw error
    }

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error("Error fetching schedules:", error)
    return NextResponse.json({ schedules: [] })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { data: schedule, error } = await supabase
      .from("shift_schedules")
      .insert({
        practice_id: practiceId,
        team_member_id: body.team_member_id,
        shift_type_id: body.shift_type_id,
        shift_date: body.shift_date,
        start_time: body.start_time,
        end_time: body.end_time,
        break_minutes: body.break_minutes || 30,
        status: "scheduled",
        notes: body.notes,
        created_by: body.created_by,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Error creating schedule:", error)
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const { data: availability, error } = await supabase
      .from("employee_availability")
      .select("*")
      .eq("practice_id", practiceId)

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ availability: [] })
      }
      throw error
    }

    return NextResponse.json({ availability })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json({ availability: [] })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { data: availability, error } = await supabase
      .from("employee_availability")
      .insert({
        practice_id: practiceId,
        team_member_id: body.team_member_id,
        day_of_week: body.day_of_week,
        specific_date: body.specific_date,
        availability_type: body.availability_type,
        start_time: body.start_time,
        end_time: body.end_time,
        notes: body.notes,
        is_recurring: body.is_recurring !== false,
        valid_from: body.valid_from,
        valid_until: body.valid_until,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ availability })
  } catch (error) {
    console.error("Error creating availability:", error)
    return NextResponse.json({ error: "Failed to create availability" }, { status: 500 })
  }
}

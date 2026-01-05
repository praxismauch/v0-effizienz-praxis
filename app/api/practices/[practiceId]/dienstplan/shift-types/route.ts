import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const { data: shiftTypes, error } = await supabase
      .from("shift_types")
      .select("*")
      .eq("practice_id", practiceId)
      .order("start_time")

    if (error) {
      // Table might not exist yet
      if (error.code === "42P01") {
        return NextResponse.json({ shiftTypes: [] })
      }
      throw error
    }

    return NextResponse.json({ shiftTypes })
  } catch (error) {
    console.error("Error fetching shift types:", error)
    return NextResponse.json({ shiftTypes: [] })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { data: shiftType, error } = await supabase
      .from("shift_types")
      .insert({
        practice_id: practiceId,
        name: body.name,
        short_name: body.short_name,
        start_time: body.start_time,
        end_time: body.end_time,
        break_minutes: body.break_minutes || 30,
        color: body.color || "#3b82f6",
        description: body.description,
        min_staff: body.min_staff || 1,
        max_staff: body.max_staff,
        is_active: body.is_active !== false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ shiftType })
  } catch (error) {
    console.error("Error creating shift type:", error)
    return NextResponse.json({ error: "Failed to create shift type" }, { status: 500 })
  }
}

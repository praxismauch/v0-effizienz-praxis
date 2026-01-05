import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch blocked periods
export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("holiday_blocked_periods")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("start_date", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching blocked periods:", error)
      return NextResponse.json({ error: "Failed to fetch blocked periods" }, { status: 500 })
    }

    return NextResponse.json({ blockedPeriods: data || [] })
  } catch (error) {
    console.error("[v0] Error in blocked periods GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a blocked period
export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const body = await request.json()

    const name = body.name
    const startDate = body.startDate || body.start_date
    const endDate = body.endDate || body.end_date
    const reason = body.reason
    const maxAbsentPercentage = body.maxAbsentPercentage || body.max_absent_percentage
    const isRecurring = body.isRecurring || body.is_recurring
    const createdBy = body.createdBy || body.created_by

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!createdBy) {
      return NextResponse.json({ error: "created_by is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("holiday_blocked_periods")
      .insert({
        practice_id: practiceId,
        name,
        start_date: startDate,
        end_date: endDate,
        reason,
        max_absent_percentage: maxAbsentPercentage || 0,
        is_recurring: isRecurring || false,
        created_by: createdBy,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating blocked period:", error)
      return NextResponse.json({ error: "Failed to create blocked period" }, { status: 500 })
    }

    return NextResponse.json({ blockedPeriod: data })
  } catch (error) {
    console.error("[v0] Error in blocked period POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete a blocked period
export async function DELETE(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing blocked period ID" }, { status: 400 })
    }

    const { error } = await supabase
      .from("holiday_blocked_periods")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Error deleting blocked period:", error)
      return NextResponse.json({ error: "Failed to delete blocked period" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in blocked period DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

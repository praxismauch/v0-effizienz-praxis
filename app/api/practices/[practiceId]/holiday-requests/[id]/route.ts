import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch a single holiday request
export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("holiday_requests")
      .select(`
        *,
        team_member:team_members(
          id, first_name, last_name, user_id,
          user:users(id, name, first_name, last_name, avatar)
        )
      `)
      .eq("id", id)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .single()

    if (error) {
      return NextResponse.json({ error: "Holiday request not found" }, { status: 404 })
    }

    return NextResponse.json({ request: data })
  } catch (error) {
    console.error("[v0] Error fetching holiday request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update a holiday request
export async function PUT(request: Request, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { startDate, endDate, priority, reason, notes, status, approvedBy, rejectionReason } = body

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (startDate) updateData.start_date = startDate
    if (endDate) updateData.end_date = endDate
    if (priority !== undefined) updateData.priority = priority
    if (reason !== undefined) updateData.reason = reason
    if (notes !== undefined) updateData.notes = notes
    if (status) {
      updateData.status = status
      if (status === "approved" && approvedBy) {
        updateData.approved_by = approvedBy
        updateData.approved_at = new Date().toISOString()
      }
      if (status === "rejected" && rejectionReason) {
        updateData.rejection_reason = rejectionReason
      }
    }

    // Recalculate days if dates changed
    if (startDate && endDate) {
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
      updateData.days_count = daysCount
    }

    const { data, error } = await supabase
      .from("holiday_requests")
      .update(updateData)
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating holiday request:", error)
      return NextResponse.json({ error: "Failed to update holiday request" }, { status: 500 })
    }

    return NextResponse.json({ request: data })
  } catch (error) {
    console.error("[v0] Error in holiday request PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Soft delete a holiday request
export async function DELETE(request: Request, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from("holiday_requests")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Error deleting holiday request:", error)
      return NextResponse.json({ error: "Failed to delete holiday request" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in holiday request DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

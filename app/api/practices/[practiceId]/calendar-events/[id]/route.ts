import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { isRateLimitError } from "@/lib/supabase/safe-query"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params

    const body = await request.json()

    let adminClient
    try {
      adminClient = await createAdminClient()
    } catch (adminError) {
      if (isRateLimitError(adminError)) {
        return NextResponse.json({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }, { status: 429 })
      }
      throw adminError
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.startDate !== undefined) updateData.start_date = body.startDate
    if (body.endDate !== undefined) updateData.end_date = body.endDate
    if (body.startTime !== undefined) updateData.start_time = body.startTime
    if (body.endTime !== undefined) updateData.end_time = body.endTime
    if (body.type !== undefined) updateData.type = body.type
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.location !== undefined) updateData.location = body.location
    if (body.isAllDay !== undefined) updateData.is_all_day = body.isAllDay
    if (body.recurrence !== undefined) updateData.recurrence_type = body.recurrence
    if (body.recurrenceType !== undefined) updateData.recurrence_type = body.recurrenceType
    if (body.attendees !== undefined) updateData.attendees = body.attendees

    let data, error
    try {
      const result = await adminClient
        .from("calendar_events")
        .update(updateData)
        .eq("id", id)
        .eq("practice_id", practiceId)
        .is("deleted_at", null)
        .select()
        .maybeSingle()
      data = result.data
      error = result.error
    } catch (updateException: any) {
      if (isRateLimitError(updateException)) {
        return NextResponse.json({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }, { status: 429 })
      }
      throw updateException
    }

    if (error) {
      console.error("Error updating calendar event:", error)
      return NextResponse.json(
        { error: "Fehler beim Aktualisieren des Termins", details: error.message },
        { status: 500 },
      )
    }

    if (!data) {
      return NextResponse.json({ error: "Termin nicht gefunden" }, { status: 404 })
    }

    const event = {
      id: data.id,
      title: data.title,
      description: data.description,
      startDate: data.start_date,
      endDate: data.end_date,
      startTime: data.start_time,
      endTime: data.end_time,
      type: data.type,
      priority: data.priority,
      location: data.location,
      isAllDay: data.is_all_day,
      recurrence: data.recurrence_type,
      recurrenceType: data.recurrence_type,
      attendees: data.attendees || [],
      practiceId: data.practice_id,
      createdBy: data.created_by,
      createdAt: data.created_at,
    }

    return NextResponse.json({ event })
  } catch (error: any) {
    if (isRateLimitError(error)) {
      return NextResponse.json({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }, { status: 429 })
    }
    console.error("Error in PUT /calendar-events/[id]:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; id: string }> },
) {
  try {
    const { practiceId, id } = await params

    let adminClient
    try {
      adminClient = await createAdminClient()
    } catch (adminError) {
      if (isRateLimitError(adminError)) {
        return NextResponse.json({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }, { status: 429 })
      }
      throw adminError
    }

    let error
    try {
      const result = await adminClient
        .from("calendar_events")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .eq("practice_id", practiceId)
        .is("deleted_at", null)
      error = result.error
    } catch (deleteException: any) {
      if (isRateLimitError(deleteException)) {
        return NextResponse.json({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }, { status: 429 })
      }
      throw deleteException
    }

    if (error) {
      console.error("Error deleting calendar event:", error)
      return NextResponse.json({ error: "Fehler beim Löschen des Termins" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (isRateLimitError(error)) {
      return NextResponse.json({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }, { status: 429 })
    }
    console.error("Error in DELETE /calendar-events/[id]:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

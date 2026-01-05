import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; entryId: string }> },
) {
  try {
    const { practiceId, entryId } = await params
    const body = await request.json()
    const supabase = await createAdminClient()

    const updateData: any = {
      name: body.name,
      team_id: body.team_id,
      hours: body.hours,
      notes: body.notes,
      calculate_from_timespan: body.calculate_from_timespan,
      start_time: body.start_time,
      end_time: body.end_time,
      updated_at: new Date().toISOString(),
    }

    // Only update display_order if explicitly provided
    if (body.display_order !== undefined) {
      updateData.display_order = body.display_order
    }

    // If moving to a different slot, update day_of_week and time_slot
    if (body.day_of_week !== undefined) {
      updateData.day_of_week = body.day_of_week
    }
    if (body.time_slot !== undefined) {
      updateData.time_slot = body.time_slot
    }

    const { data, error } = await supabase
      .from("staffing_plan")
      .update(updateData)
      .eq("id", entryId)
      .eq("practice_id", practiceId)
      .select(
        `
        *,
        team:teams(id, name, color)
      `,
      )
      .single()

    if (error) {
      console.error("[v0] Error updating staffing entry:", error)

      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "Ein Eintrag für dieses Team existiert bereits in diesem Zeitfenster. Bitte wählen Sie ein anderes Team oder löschen Sie den bestehenden Eintrag.",
            code: "DUPLICATE_ENTRY",
          },
          { status: 409 },
        )
      }

      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; entryId: string }> },
) {
  try {
    const { practiceId, entryId } = await params
    const supabase = await createAdminClient()

    const { error } = await supabase.from("staffing_plan").delete().eq("id", entryId).eq("practice_id", practiceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

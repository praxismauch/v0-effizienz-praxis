import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { safeSupabaseQuery } from "@/lib/supabase/safe-query"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: settings, error } = await safeSupabaseQuery(
      () =>
        supabase
          .from("practice_settings")
          .select("calendar_settings")
          .eq("practice_id", String(practiceId))
          .single(),
      { data: null, error: null },
    )

    if (error || !settings) {
      console.error("[v0] Calendar settings GET error:", error?.message)
      return NextResponse.json({
        defaultView: "week",
        weekStart: "monday",
        workStart: "08:00",
        workEnd: "18:00",
        defaultDuration: "30",
        showWeekends: false,
        showHolidays: true,
      })
    }

    return NextResponse.json(settings.calendar_settings || {
      defaultView: "week",
      weekStart: "monday",
      workStart: "08:00",
      workEnd: "18:00",
      defaultDuration: "30",
      showWeekends: false,
      showHolidays: true,
    })
  } catch (error) {
    console.error("[v0] Calendar settings GET exception:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({
      defaultView: "week",
      weekStart: "monday",
      workStart: "08:00",
      workEnd: "18:00",
      defaultDuration: "30",
      showWeekends: false,
      showHolidays: true,
    })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data, error } = await safeSupabaseQuery(
      () =>
        supabase
          .from("practice_settings")
          .upsert(
            {
              practice_id: String(practiceId),
              calendar_settings: body,
            },
            { onConflict: "practice_id" },
          )
          .select()
          .single(),
      { data: null, error: null },
    )

    if (error) {
      console.error("[v0] Calendar settings POST error:", error.message)
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true, settings: data })
  } catch (error) {
    console.error("[v0] Calendar settings POST exception:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

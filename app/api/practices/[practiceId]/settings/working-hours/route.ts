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
          .select("working_hours_settings")
          .eq("practice_id", String(practiceId))
          .single(),
      { data: null, error: null },
    )

    if (error || !settings) {
      console.error("[v0] Working hours GET error:", error?.message)
      return NextResponse.json({
        hours_per_week: 40,
        days_per_week: 5,
        vacation_days: 30,
        flex_time_enabled: false,
        overtime_limit: 20,
        break_duration: 30,
        track_breaks: true,
      })
    }

    return NextResponse.json(settings.working_hours_settings || {
      hours_per_week: 40,
      days_per_week: 5,
      vacation_days: 30,
      flex_time_enabled: false,
      overtime_limit: 20,
      break_duration: 30,
      track_breaks: true,
    })
  } catch (error) {
    console.error("[v0] Working hours GET exception:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({
      hours_per_week: 40,
      days_per_week: 5,
      vacation_days: 30,
      flex_time_enabled: false,
      overtime_limit: 20,
      break_duration: 30,
      track_breaks: true,
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
              working_hours_settings: body,
            },
            { onConflict: "practice_id" },
          )
          .select()
          .single(),
      { data: null, error: null },
    )

    if (error) {
      console.error("[v0] Working hours POST error:", error.message)
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true, settings: data })
  } catch (error) {
    console.error("[v0] Working hours POST exception:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

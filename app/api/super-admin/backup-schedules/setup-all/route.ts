import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    const isPreview =
      process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
      process.env.VERCEL_ENV === "preview" ||
      !process.env.NEXT_PUBLIC_VERCEL_ENV

    let userId: string

    if (isPreview) {
      userId = "36883b61-34e4-4b9e-8a11-eb1a9656d2a0"
    } else {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      userId = user.id
    }

    console.log("[v0] Setting up daily backup schedules for all practices...")

    // Get all active practices
    const { data: practices, error: practicesError } = await adminClient
      .from("practices")
      .select("id, name")
      .is("deleted_at", null)

    if (practicesError) throw practicesError

    // Get existing schedules
    const { data: existingSchedules, error: schedulesError } = await adminClient
      .from("backup_schedules")
      .select("practice_id")

    if (schedulesError) throw schedulesError

    const existingPracticeIds = new Set(existingSchedules?.map((s) => s.practice_id) || [])

    const created = []
    const skipped = []

    for (const practice of practices || []) {
      if (existingPracticeIds.has(practice.id)) {
        skipped.push({ id: practice.id, name: practice.name, reason: "Already has schedule" })
        continue
      }

      // Calculate next run time (tomorrow at 2:00 AM)
      const nextRun = new Date()
      nextRun.setDate(nextRun.getDate() + 1)
      nextRun.setHours(2, 0, 0, 0)

      const scheduleData = {
        practice_id: practice.id,
        schedule_type: "daily",
        backup_scope: "practice",
        time_of_day: "02:00",
        day_of_week: null,
        day_of_month: null,
        is_active: true,
        retention_days: 30,
        next_run_at: nextRun.toISOString(),
        created_by: userId,
        sync_to_google_drive: false,
      }

      const { data: schedule, error: createError } = await adminClient
        .from("backup_schedules")
        .insert(scheduleData)
        .select()
        .single()

      if (createError) {
        console.error(`[v0] Error creating schedule for practice ${practice.id}:`, createError)
        skipped.push({ id: practice.id, name: practice.name, reason: createError.message })
      } else {
        created.push({ id: practice.id, name: practice.name, schedule_id: schedule.id })
      }
    }

    console.log(`[v0] Created ${created.length} backup schedules, skipped ${skipped.length}`)

    return NextResponse.json({
      success: true,
      created_count: created.length,
      skipped_count: skipped.length,
      created,
      skipped,
    })
  } catch (error: any) {
    console.error("[v0] Error setting up backup schedules:", error)
    return NextResponse.json({ error: error.message || "Failed to setup backup schedules" }, { status: 500 })
  }
}

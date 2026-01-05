import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// API to fix stuck backup schedules - resets next_run_at for schedules that should have run
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const now = new Date()

    // Get all active schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from("backup_schedules")
      .select("*")
      .eq("is_active", true)

    if (schedulesError) throw schedulesError

    const fixed = []
    const skipped = []

    for (const schedule of schedules || []) {
      // Check if next_run_at is more than 2 days in the past (stuck)
      const nextRunAt = schedule.next_run_at ? new Date(schedule.next_run_at) : null
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      if (nextRunAt && nextRunAt < twoDaysAgo) {
        // Schedule is stuck - reset to run tomorrow
        const nextRun = new Date()
        nextRun.setDate(nextRun.getDate() + 1)
        const [hours, minutes] = (schedule.time_of_day || "02:00").split(":").map(Number)
        nextRun.setHours(hours, minutes, 0, 0)

        const { error: updateError } = await supabase
          .from("backup_schedules")
          .update({
            next_run_at: nextRun.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("id", schedule.id)

        if (updateError) {
          skipped.push({
            id: schedule.id,
            practice_id: schedule.practice_id,
            reason: updateError.message,
          })
        } else {
          fixed.push({
            id: schedule.id,
            practice_id: schedule.practice_id,
            old_next_run: schedule.next_run_at,
            new_next_run: nextRun.toISOString(),
          })
        }
      } else {
        skipped.push({
          id: schedule.id,
          practice_id: schedule.practice_id,
          reason: "Not stuck - next_run_at is recent",
          next_run_at: schedule.next_run_at,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixed.length} stuck schedules`,
      fixed_count: fixed.length,
      skipped_count: skipped.length,
      fixed,
      skipped,
    })
  } catch (error: any) {
    console.error("[v0] Error fixing stuck schedules:", error)
    return NextResponse.json({ error: error.message || "Failed to fix stuck schedules" }, { status: 500 })
  }
}

// GET endpoint to diagnose backup schedule issues
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const now = new Date()

    // Get all schedules with their status
    const { data: schedules, error: schedulesError } = await supabase
      .from("backup_schedules")
      .select("*, practice:practices(id, name)")
      .order("created_at", { ascending: false })

    if (schedulesError) throw schedulesError

    // Get recent backups
    const { data: recentBackups, error: backupsError } = await supabase
      .from("backups")
      .select("id, practice_id, created_at, status, backup_type")
      .order("created_at", { ascending: false })
      .limit(10)

    if (backupsError) throw backupsError

    // Analyze schedules
    const analysis = schedules?.map((schedule) => {
      const nextRunAt = schedule.next_run_at ? new Date(schedule.next_run_at) : null
      const lastRunAt = schedule.last_run_at ? new Date(schedule.last_run_at) : null
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      let status = "healthy"
      let issue = null

      if (!schedule.is_active) {
        status = "inactive"
        issue = "Schedule is inactive"
      } else if (!nextRunAt) {
        status = "error"
        issue = "No next_run_at set"
      } else if (nextRunAt < twoDaysAgo) {
        status = "stuck"
        issue = `next_run_at is ${Math.floor((now.getTime() - nextRunAt.getTime()) / (1000 * 60 * 60 * 24))} days in the past`
      } else if (nextRunAt > now) {
        status = "scheduled"
        issue = null
      }

      return {
        id: schedule.id,
        practice_id: schedule.practice_id,
        practice_name: schedule.practice?.name || "Unknown",
        is_active: schedule.is_active,
        schedule_type: schedule.schedule_type,
        time_of_day: schedule.time_of_day,
        last_run_at: schedule.last_run_at,
        next_run_at: schedule.next_run_at,
        status,
        issue,
      }
    })

    const stuckCount = analysis?.filter((a) => a.status === "stuck").length || 0
    const inactiveCount = analysis?.filter((a) => a.status === "inactive").length || 0
    const healthyCount = analysis?.filter((a) => a.status === "healthy" || a.status === "scheduled").length || 0

    return NextResponse.json({
      success: true,
      summary: {
        total_schedules: schedules?.length || 0,
        healthy: healthyCount,
        stuck: stuckCount,
        inactive: inactiveCount,
        cron_secret_set: !!process.env.CRON_SECRET,
        current_time: now.toISOString(),
      },
      schedules: analysis,
      recent_backups: recentBackups,
    })
  } catch (error: any) {
    console.error("[v0] Error diagnosing backup schedules:", error)
    return NextResponse.json({ error: error.message || "Failed to diagnose" }, { status: 500 })
  }
}

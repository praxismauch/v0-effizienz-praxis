import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const now = new Date()

    // Get all backup schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from("backup_schedules")
      .select("*")
      .order("created_at", { ascending: false })

    if (schedulesError) throw schedulesError

    // Get recent backups
    const { data: recentBackups, error: backupsError } = await supabase
      .from("backups")
      .select("*")
      .eq("backup_type", "automatic")
      .order("created_at", { ascending: false })
      .limit(10)

    if (backupsError) throw backupsError

    // Check which schedules should run now
    const shouldRunNow = schedules?.filter((s) => s.is_active && new Date(s.next_run_at) <= now) || []

    // Diagnostics
    const diagnostics = {
      currentTime: now.toISOString(),
      totalSchedules: schedules?.length || 0,
      activeSchedules: schedules?.filter((s) => s.is_active).length || 0,
      inactiveSchedules: schedules?.filter((s) => !s.is_active).length || 0,
      schedulesDueToRun: shouldRunNow.length,
      recentBackups: recentBackups?.length || 0,
      schedules: schedules?.map((s) => ({
        id: s.id,
        practice_id: s.practice_id,
        schedule_type: s.schedule_type,
        time_of_day: s.time_of_day,
        is_active: s.is_active,
        next_run_at: s.next_run_at,
        last_run_at: s.last_run_at,
        should_run_now: s.is_active && new Date(s.next_run_at) <= now,
        hours_until_next_run: s.next_run_at
          ? ((new Date(s.next_run_at).getTime() - now.getTime()) / (1000 * 60 * 60)).toFixed(2)
          : null,
      })),
      recentBackupsList: recentBackups?.map((b) => ({
        id: b.id,
        practice_id: b.practice_id,
        created_at: b.created_at,
        status: b.status,
        metadata: b.metadata,
      })),
    }

    return NextResponse.json(diagnostics)
  } catch (error: any) {
    console.error("[v0] Error in backup diagnostics:", error)
    return NextResponse.json({ error: error.message || "Failed to run diagnostics" }, { status: 500 })
  }
}

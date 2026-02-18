import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    // Get backups from the last 7 days for the dashboard overview
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: backups, error } = await supabase
      .from("backups")
      .select("id, status, created_at, backup_type, backup_scope, practice_id, file_size, metadata")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })

    if (error) throw error

    const allBackups = backups || []

    // Check today's backups
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayBackups = allBackups.filter(b => new Date(b.created_at) >= todayStart)

    // Check yesterday's backups (in case daily cron runs at night)
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const yesterdayBackups = allBackups.filter(
      b => new Date(b.created_at) >= yesterdayStart && new Date(b.created_at) < todayStart
    )

    // Use today's or yesterday's backups (whichever is more recent)
    const latestDayBackups = todayBackups.length > 0 ? todayBackups : yesterdayBackups

    const verified = latestDayBackups.filter(b => b.status === "verified").length
    const completed = latestDayBackups.filter(b => b.status === "completed").length
    const failed = latestDayBackups.filter(b => b.status === "verification_failed" || b.status === "failed").length

    // Build daily history for last 7 days
    const dailyHistory: Array<{
      date: string
      total: number
      verified: number
      failed: number
      status: "success" | "warning" | "error" | "missing"
    }> = []

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(todayStart)
      dayStart.setDate(dayStart.getDate() - i)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const dayBackups = allBackups.filter(
        b => new Date(b.created_at) >= dayStart && new Date(b.created_at) < dayEnd
      )

      const dayVerified = dayBackups.filter(b => b.status === "verified").length
      const dayFailed = dayBackups.filter(b => b.status === "verification_failed" || b.status === "failed").length

      let status: "success" | "warning" | "error" | "missing" = "missing"
      if (dayBackups.length === 0) {
        // Don't mark today as missing if it's early in the day
        if (i === 0 && new Date().getHours() < 6) {
          status = "warning"
        } else if (i === 0) {
          status = "warning" // Today might still run
        } else {
          status = "missing"
        }
      } else if (dayFailed > 0) {
        status = "error"
      } else if (dayVerified > 0) {
        status = "success"
      } else {
        status = "warning" // completed but not verified
      }

      dailyHistory.push({
        date: dayStart.toISOString().split("T")[0],
        total: dayBackups.length,
        verified: dayVerified,
        failed: dayFailed,
        status,
      })
    }

    // Find the latest backup
    const latestBackup = allBackups[0] || null

    // Determine overall status
    let overallStatus: "success" | "warning" | "error" = "success"
    if (latestDayBackups.length === 0) {
      overallStatus = todayBackups.length === 0 && yesterdayBackups.length === 0 ? "error" : "warning"
    } else if (failed > 0) {
      overallStatus = "error"
    } else if (verified === 0 && completed > 0) {
      overallStatus = "warning"
    }

    // Get errors from failed backups
    const errors: string[] = []
    for (const b of latestDayBackups.filter(b => b.status === "verification_failed" || b.status === "failed")) {
      const meta = b.metadata as any
      if (meta?.verification?.errors) {
        errors.push(...meta.verification.errors)
      } else {
        errors.push(`Backup ${b.id.slice(0, 8)} fehlgeschlagen`)
      }
    }

    return NextResponse.json({
      overallStatus,
      today: {
        total: latestDayBackups.length,
        verified,
        completed,
        failed,
      },
      latestBackup: latestBackup
        ? {
            id: latestBackup.id,
            status: latestBackup.status,
            created_at: latestBackup.created_at,
            file_size: latestBackup.file_size,
            backup_type: latestBackup.backup_type,
          }
        : null,
      dailyHistory,
      errors,
      totalLast7Days: allBackups.length,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching backup status:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch backup status" },
      { status: 500 }
    )
  }
}

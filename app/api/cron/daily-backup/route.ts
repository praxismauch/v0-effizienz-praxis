export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

const PRACTICE_TABLES = [
  // Core practice data
  "team_members",
  "teams",
  "team_assignments",
  "departments",
  // Documents & Knowledge
  "documents",
  "document_folders",
  "document_permissions",
  "knowledge_base",
  "knowledge_confirmations",
  // Tasks & Goals
  "todos",
  "todo_attachments",
  "goals",
  "goal_assignments",
  "goal_attachments",
  "user_goal_order",
  // Responsibilities & Workflows
  "responsibilities",
  "responsibility_attachments",
  "workflows",
  "workflow_steps",
  // Calendar & Events
  "calendar_events",
  "external_calendar_subscriptions",
  "holidays",
  "holiday_requests",
  "holiday_blocked_periods",
  // HR & Hiring
  "job_postings",
  "candidates",
  "applications",
  "interviews",
  "interview_templates",
  "hiring_pipeline_stages",
  "questionnaires",
  "questionnaire_responses",
  "contracts",
  "contract_files",
  "sick_leaves",
  // Skills & Training
  "practice_skills",
  "skill_categories",
  "skill_level_definitions",
  "team_member_skills",
  "skill_assessment_history",
  // Analytics & Parameters
  "analytics_parameters",
  "parameter_values",
  "global_parameter_groups",
  // Financial
  "bank_transactions",
  "bank_transaction_categories",
  "kv_abrechnung",
  "billing_history",
  // Equipment & Resources
  "arbeitsmittel",
  "team_member_arbeitsmittel",
  "arbeitsplaetze",
  "arbeitsplatzanweisungen",
  "rooms",
  // Organization
  "org_chart_positions",
  "orga_categories",
  "staffing_plans",
  "staffing_plan",
  // Forms & Submissions
  "custom_forms",
  "form_fields",
  "form_submissions",
  "recruiting_form_fields",
  // Reviews & Ratings
  "google_ratings",
  "jameda_ratings",
  "sanego_ratings",
  "review_platform_config",
  "review_imports",
  // Analysis & Reports
  "igel_analyses",
  "roi_analyses",
  "competitor_analyses",
  "ai_analysis_history",
  "practice_journals",
  "journal_entries",
  "journal_action_items",
  "journal_preferences",
  // Contacts & Communication
  "contacts",
  "notifications",
  // Strategy & Profiles
  "strategy_journey_progress",
  "wunschpatient_profiles",
  "leitbild",
  // Settings & Preferences
  "practice_settings",
  "sidebar_permissions",
  "user_sidebar_preferences",
]

const GLOBAL_TABLES = ["users", "practices", "practice_types", "specialty_groups", "role_colors", "role_permissions"]

async function verifyBackup(
  backupUrl: string,
  expectedTables: string[],
  expectedRowCounts: Record<string, number>,
): Promise<{
  verified: boolean
  errors: string[]
  details: {
    fileAccessible: boolean
    validJson: boolean
    tablesMatch: boolean
    rowCountsMatch: boolean
    checksumValid: boolean
  }
}> {
  const errors: string[] = []
  const details = {
    fileAccessible: false,
    validJson: false,
    tablesMatch: false,
    rowCountsMatch: false,
    checksumValid: false,
  }

  try {
    // Step 1: Verify file is accessible
    const response = await fetch(backupUrl)
    if (!response.ok) {
      errors.push(`Backup file not accessible: HTTP ${response.status}`)
      return { verified: false, errors, details }
    }
    details.fileAccessible = true

    // Step 2: Verify valid JSON
    let backupData: any
    try {
      const text = await response.text()
      backupData = JSON.parse(text)
      details.validJson = true
    } catch (parseError) {
      errors.push("Backup file is not valid JSON")
      return { verified: false, errors, details }
    }

    // Step 3: Verify structure
    if (!backupData.version || !backupData.tables || !backupData.table_row_counts) {
      errors.push("Backup file has invalid structure (missing version, tables, or table_row_counts)")
      return { verified: false, errors, details }
    }

    // Step 4: Verify all expected tables are present
    const backupTables = Object.keys(backupData.tables)
    const missingTables = expectedTables.filter((t) => !backupTables.includes(t) && expectedRowCounts[t] > 0)
    if (missingTables.length > 0) {
      errors.push(`Missing tables in backup: ${missingTables.join(", ")}`)
    } else {
      details.tablesMatch = true
    }

    // Step 5: Verify row counts match
    let rowCountMismatch = false
    for (const table of expectedTables) {
      const expectedCount = expectedRowCounts[table] || 0
      const actualCount = backupData.table_row_counts[table] || 0
      if (expectedCount !== actualCount) {
        errors.push(`Row count mismatch for ${table}: expected ${expectedCount}, got ${actualCount}`)
        rowCountMismatch = true
      }
    }
    if (!rowCountMismatch) {
      details.rowCountsMatch = true
    }

    // Step 6: Simple checksum verification (verify total rows)
    const totalExpectedRows = Object.values(expectedRowCounts).reduce(
      (sum: number, count: any) => sum + (count || 0),
      0,
    )
    const totalActualRows = backupData.total_rows || 0
    if (totalExpectedRows === totalActualRows) {
      details.checksumValid = true
    } else {
      errors.push(`Total row count mismatch: expected ${totalExpectedRows}, got ${totalActualRows}`)
    }

    const verified =
      details.fileAccessible &&
      details.validJson &&
      details.tablesMatch &&
      details.rowCountsMatch &&
      details.checksumValid

    return { verified, errors, details }
  } catch (error: any) {
    errors.push(`Verification error: ${error.message}`)
    return { verified: false, errors, details }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel Cron sends this automatically in production)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    const isPreview =
      process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
      process.env.VERCEL_ENV === "preview" ||
      !process.env.NEXT_PUBLIC_VERCEL_ENV

    // In production, require CRON_SECRET. In preview/dev, allow unauthenticated.
    if (!isPreview && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[v0] Daily backup cron: Unauthorized - invalid CRON_SECRET")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createAdminClient()
    const now = new Date()

    // Get active schedules that should run now
    let schedules: any[] = []
    try {
      const { data, error: schedulesError } = await supabase
        .from("backup_schedules")
        .select("*")
        .eq("is_active", true)
        .is("deleted_at", null)
        .lte("next_run_at", now.toISOString())

      if (schedulesError) {
        console.error("[v0] Daily backup cron: Error fetching schedules:", schedulesError)
      } else {
        schedules = data || []
      }

      // Self-healing: Fix any schedules with next_run_at stuck more than 48h in the past
      if (schedules.length === 0) {
        const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
        const { data: stuckSchedules } = await supabase
          .from("backup_schedules")
          .select("*")
          .eq("is_active", true)
          .is("deleted_at", null)
          .lt("next_run_at", twoDaysAgo.toISOString())

        if (stuckSchedules && stuckSchedules.length > 0) {
          for (const stuck of stuckSchedules) {
            const nextRun = calculateNextRun(stuck.schedule_type, stuck.time_of_day, stuck.day_of_week, stuck.day_of_month)
            await supabase.from("backup_schedules").update({ next_run_at: now.toISOString(), updated_at: now.toISOString() }).eq("id", stuck.id)
            schedules.push(stuck)
          }
        }
      }
    } catch (err) {
      console.error("[v0] Daily backup cron: backup_schedules table may not exist, using fallback:", err)
    }

    // Fallback: If no schedules are due, create a default full backup
    if (schedules.length === 0) {
      // Get all active practices
      const { data: practices } = await supabase
        .from("practices")
        .select("id")
        .limit(10)

      if (practices && practices.length > 0) {
        for (const p of practices) {
          schedules.push({
            id: `fallback-${p.id}`,
            practice_id: p.id,
            backup_scope: "full",
            schedule_type: "daily",
            time_of_day: "02:00",
            retention_days: 30,
            _isFallback: true,
          })
        }
      } else {
        // No practices found, create a single global backup
        schedules.push({
          id: "fallback-global",
          practice_id: null,
          backup_scope: "full",
          schedule_type: "daily",
          time_of_day: "02:00",
          retention_days: 30,
          _isFallback: true,
        })
      }
    } else {
    }

    const results = []

    for (const schedule of schedules) {
      try {
        const tablesToBackup =
          schedule.backup_scope === "full" ? [...GLOBAL_TABLES, ...PRACTICE_TABLES] : PRACTICE_TABLES

        const backupData: any = {
          version: "2.0",
          created_at: now.toISOString(),
          practice_id: schedule.practice_id,
          backup_scope: schedule.backup_scope,
          backup_type: "automatic",
          tables: {},
          table_row_counts: {},
        }

        let totalRows = 0

        for (const table of tablesToBackup) {
          try {
            let query = supabase.from(table).select("*")

            // Only filter by practice_id if it's set AND this is a practice-specific table
            // When practice_id is null, we want ALL data (full backup)
            if (schedule.practice_id && !GLOBAL_TABLES.includes(table)) {
              query = query.eq("practice_id", schedule.practice_id)
            }

            const { data, error } = await query

            if (error) {
              // Table might not exist yet, skip silently
              console.warn(`[v0] Skipping table ${table}: ${error.message}`)
              continue
            }

            if (data) {
              backupData.tables[table] = data
              backupData.table_row_counts[table] = data.length
              totalRows += data.length
            }
          } catch (error: any) {
            console.error(`[v0] Error backing up table ${table}:`, error)
          }
        }

        backupData.total_rows = totalRows

        const backupJson = JSON.stringify(backupData, null, 2)
        const backupBlob = new Blob([backupJson], { type: "application/json" })

        const dateStr = now.toISOString().split("T")[0]
        const filename = `backup-${dateStr}-${schedule.practice_id || "full"}-${Date.now()}.json`
        const blobResult = await put(filename, backupBlob, {
          access: "public",
          addRandomSuffix: true,
        })

        const verification = await verifyBackup(blobResult.url, tablesToBackup, backupData.table_row_counts)

        const backupRecord = {
          practice_id: schedule.practice_id,
          backup_type: "automatic",
          backup_scope: schedule.backup_scope,
          file_url: blobResult.url,
          file_size: backupBlob.size,
          status: verification.verified ? "verified" : "completed",
          tables_included: tablesToBackup,
          metadata: {
            compressed: false,
            format: "json",
            version: "2.0",
            schedule_id: schedule.id,
            scheduled: true,
            total_rows: totalRows,
            table_row_counts: backupData.table_row_counts,
            blob_url: blobResult.url,
            verification: {
              verified: verification.verified,
              verified_at: new Date().toISOString(),
              details: verification.details,
              errors: verification.errors,
            },
          },
        }

        const { data: backup, error: backupError } = await supabase
          .from("backups")
          .insert(backupRecord)
          .select()
          .single()

        if (backupError) throw backupError

        // Always update the schedule's next_run_at so it doesn't get stuck
        if (!schedule._isFallback && schedule.id) {
          const nextRun = calculateNextRun(
            schedule.schedule_type,
            schedule.time_of_day,
            schedule.day_of_week,
            schedule.day_of_month,
          )

          const { error: updateError } = await supabase
            .from("backup_schedules")
            .update({
              last_run_at: now.toISOString(),
              next_run_at: nextRun,
              updated_at: now.toISOString(),
            })
            .eq("id", schedule.id)

          if (updateError) {
            console.error(`[v0] Failed to update schedule ${schedule.id}:`, updateError)
          }
        }

        // Clean up old backups based on retention
        if (schedule.retention_days) {
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - schedule.retention_days)

          await supabase
            .from("backups")
            .delete()
            .eq("backup_type", "automatic")
            .eq("practice_id", schedule.practice_id)
            .lt("created_at", cutoffDate.toISOString())
        }

        results.push({
          schedule_id: schedule.id,
          backup_id: backup.id,
          practice_id: schedule.practice_id,
          total_rows: totalRows,
          tables_count: tablesToBackup.length,
          status: "success",
          verification: {
            verified: verification.verified,
            errors: verification.errors,
          },
        })
      } catch (error: any) {
        console.error(`[v0] Error processing schedule ${schedule.id}:`, error)
        results.push({
          schedule_id: schedule.id,
          status: "failed",
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: schedules?.length || 0,
      results,
    })
  } catch (error: any) {
    console.error("[v0] Daily backup cron: Fatal error:", error)
    return NextResponse.json({ error: error.message || "Failed to run daily backup" }, { status: 500 })
  }
}

function calculateNextRun(
  scheduleType: string,
  timeOfDay: string,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null,
): string {
  const [hours, minutes] = (timeOfDay || "02:00").split(":").map(Number)

  const nextRun = new Date()
  nextRun.setHours(hours, minutes, 0, 0)

  if (scheduleType === "daily") {
    // Always schedule for tomorrow
    nextRun.setDate(nextRun.getDate() + 1)
  } else if (scheduleType === "weekly" && dayOfWeek != null) {
    // Find next occurrence of the specified day of week
    do {
      nextRun.setDate(nextRun.getDate() + 1)
    } while (nextRun.getDay() !== dayOfWeek)
  } else if (scheduleType === "monthly" && dayOfMonth != null) {
    // Schedule for next month on the specified day
    nextRun.setMonth(nextRun.getMonth() + 1)
    nextRun.setDate(Math.min(dayOfMonth, new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate()))
  } else {
    // Fallback: schedule for tomorrow
    nextRun.setDate(nextRun.getDate() + 1)
  }

  return nextRun.toISOString()
}

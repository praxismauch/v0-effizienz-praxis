import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requireSuperAdmin } from "@/lib/auth/require-auth"
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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin()
    if ("response" in auth) return auth.response

    const supabase = await createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const practiceId = searchParams.get("practiceId")
    const backupType = searchParams.get("backupType")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let query = supabase
      .from("backups")
      .select(
        `
        *,
        practice:practices(id, name)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit)

    if (practiceId && practiceId !== "all") {
      query = query.eq("practice_id", practiceId)
    }

    if (backupType && backupType !== "all") {
      query = query.eq("backup_type", backupType)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("Error fetching backups:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch backups" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin()
    if ("response" in auth) return auth.response

    const adminClient = await createAdminClient()
    const userId = auth.user.id

    const body = await request.json()
    const { practiceId, backupType = "manual", backupScope = "full", notes } = body

    // Convert "all" or empty practiceId to null for DB FK constraint
    const safePracticeId = (practiceId && practiceId !== "all") ? practiceId : null

    const tablesToBackup = backupScope === "full" ? [...GLOBAL_TABLES, ...PRACTICE_TABLES] : PRACTICE_TABLES

    const backupData: any = {
      version: "2.0",
      created_at: new Date().toISOString(),
      practice_id: safePracticeId,
      backup_scope: backupScope,
      backup_type: backupType,
      tables: {},
      table_row_counts: {},
    }

    let totalRows = 0

    for (const table of tablesToBackup) {
      try {
        let query = adminClient.from(table).select("*")

        // Filter by practice_id for practice-specific tables
        if (safePracticeId && !GLOBAL_TABLES.includes(table)) {
          query = query.eq("practice_id", safePracticeId)
        }

        const { data, error } = await query

        if (error) {
          console.error(`Error backing up table ${table}:`, error)
          continue
        }

        backupData.tables[table] = data || []
        backupData.table_row_counts[table] = (data || []).length
        totalRows += (data || []).length

      } catch (error: any) {
        console.error(`Error accessing table ${table}:`, error)
      }
    }

    backupData.total_rows = totalRows

    const backupJson = JSON.stringify(backupData, null, 2)
    const backupBlob = new Blob([backupJson], { type: "application/json" })

    const dateStr = new Date().toISOString().split("T")[0]
    const filename = `backup-${dateStr}-${safePracticeId || "full"}-${Date.now()}.json`
    const blobResult = await put(filename, backupBlob, {
      access: "public",
      addRandomSuffix: true,
    })



    const backupRecord = {
      practice_id: safePracticeId,
      backup_type: backupType,
      backup_scope: backupScope,
      file_url: blobResult.url,
      file_size: backupBlob.size,
      created_by: userId,
      status: "completed",
      tables_included: tablesToBackup,
      metadata: {
        compressed: false,
        format: "json",
        version: "2.0",
        database_version: "15.1",
        total_rows: totalRows,
        table_row_counts: backupData.table_row_counts,
        blob_url: blobResult.url,
      },
      notes,
    }

    const { data, error } = await adminClient.from("backups").insert(backupRecord).select().single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error creating backup:", error)
    return NextResponse.json({ error: error.message || "Failed to create backup" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin()
    if ("response" in auth) return auth.response

    const supabase = await createAdminClient()
    const { searchParams } = request.nextUrl
    const backupId = searchParams.get("id")

    if (!backupId) {
      return NextResponse.json({ error: "Backup ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("backups").delete().eq("id", backupId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting backup:", error)
    return NextResponse.json({ error: error.message || "Failed to delete backup" }, { status: 500 })
  }
}

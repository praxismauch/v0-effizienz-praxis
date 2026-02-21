import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { trackSystemChange } from "@/lib/track-system-change"
import { requireSuperAdmin } from "@/lib/auth/require-auth"

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin()
    if ("response" in auth) return auth.response

    const supabase = await createServerClient()
    const user = auth.user

    const body = await request.json()
    const { backupId, backupData, restoreMode, selectedPracticeIds, selectedTables } = body

    // restoreMode can be: 'full', 'practices', 'tables'
    // selectedPracticeIds: array of practice IDs to restore (when mode is 'practices')
    // selectedTables: array of table names to restore (when mode is 'tables')

    if (!backupId && !backupData) {
      return NextResponse.json({ error: "Backup ID or backup data required" }, { status: 400 })
    }

    console.log("[v0] Starting backup restoration:", backupId, "mode:", restoreMode || "full")

    let backupContent: any

    if (backupData) {
      backupContent = backupData
    } else if (backupId) {
      const { data: backup, error: backupError } = await supabase
        .from("backups")
        .select("*")
        .eq("id", backupId)
        .single()

      if (backupError || !backup) {
        return NextResponse.json({ error: "Backup not found" }, { status: 404 })
      }

      console.log("[v0] Downloading backup from:", backup.file_url)
      const response = await fetch(backup.file_url)
      if (!response.ok) {
        throw new Error("Failed to download backup file from Blob storage")
      }
      backupContent = await response.json()
    }

    if (!backupContent.tables || !backupContent.version) {
      return NextResponse.json({ error: "Invalid backup format" }, { status: 400 })
    }

    const restoredTables: string[] = []
    let totalRowsRestored = 0
    const mode = restoreMode || "full"

    // Determine which tables to restore based on mode
    let tablesToRestore = Object.keys(backupContent.tables)
    
    if (mode === "tables" && selectedTables && selectedTables.length > 0) {
      // Only restore selected tables
      tablesToRestore = tablesToRestore.filter((t) => selectedTables.includes(t))
      console.log("[v0] Restoring only selected tables:", tablesToRestore)
    }

    for (const tableName of tablesToRestore) {
      try {
        let tableRows = backupContent.tables[tableName] as any[]
        if (!tableRows || tableRows.length === 0) continue

        // Filter rows by selected practices if mode is 'practices'
        if (mode === "practices" && selectedPracticeIds && selectedPracticeIds.length > 0) {
          // Check if this table has practice_id column
          const hasPracticeId = tableRows.some((row) => row.practice_id !== undefined)
          
          if (hasPracticeId) {
            tableRows = tableRows.filter((row) => selectedPracticeIds.includes(row.practice_id))
            console.log(`[v0] Filtered ${tableName} to ${tableRows.length} rows for selected practices`)
          } else if (tableName === "practices") {
            // Filter practices table by id
            tableRows = tableRows.filter((row) => selectedPracticeIds.includes(row.id))
          }
          // Tables without practice_id are skipped in practices mode (except for practices table)
          if (!hasPracticeId && tableName !== "practices") {
            console.log(`[v0] Skipping ${tableName} - no practice_id column`)
            continue
          }
        }

        if (tableRows.length === 0) continue

        console.log(`[v0] Restoring ${tableRows.length} rows to ${tableName}`)

        // Delete existing data based on restore mode
        if (mode === "practices" && selectedPracticeIds && selectedPracticeIds.length > 0) {
          // Delete only data for selected practices
          for (const practiceId of selectedPracticeIds) {
            if (tableName === "practices") {
              await supabase.from(tableName).delete().eq("id", practiceId)
            } else {
              await supabase.from(tableName).delete().eq("practice_id", practiceId)
            }
          }
        } else if (backupContent.practice_id && tableName !== "users" && tableName !== "practices") {
          await supabase.from(tableName).delete().eq("practice_id", backupContent.practice_id)
        }

        const batchSize = 100
        for (let i = 0; i < tableRows.length; i += batchSize) {
          const batch = tableRows.slice(i, i + batchSize)
          const { error: insertError } = await supabase.from(tableName).upsert(batch)

          if (insertError) {
            console.error(`[v0] Error restoring ${tableName} batch:`, insertError)
          } else {
            totalRowsRestored += batch.length
          }
        }

        restoredTables.push(tableName)
      } catch (error: any) {
        console.error(`[v0] Error restoring table ${tableName}:`, error)
      }
    }

    const practiceInfo = backupContent.practice_id ? `für Praxis ${backupContent.practice_id}` : "für gesamtes System"

    if (user) {
      await trackSystemChange({
        title: `Backup wiederhergestellt ${practiceInfo}`,
        description: `Backup vom ${new Date(backupContent.created_at).toLocaleDateString("de-DE")} wurde wiederhergestellt. ${totalRowsRestored} Zeilen in ${restoredTables.length} Tabellen wiederhergestellt.`,
        changeType: "database",
        entityType: "backup",
        entityId: backupId,
        practiceId: backupContent.practice_id,
        userId: user.id,
        isUserFacing: false,
        metadata: {
          backupId: backupId,
          backupCreatedAt: backupContent.created_at,
          tablesRestored: restoredTables,
          rowsRestored: totalRowsRestored,
          restoredAt: new Date().toISOString(),
        },
      })
    }

    await supabase.from("backup_restorations").insert({
      backup_id: backupId,
      restored_by: user?.id,
      restored_at: new Date().toISOString(),
      status: "completed",
      tables_restored: restoredTables,
      rows_restored: totalRowsRestored,
      notes: `${totalRowsRestored} Zeilen wiederhergestellt ${practiceInfo}`,
      metadata: {
        backup_version: backupContent.version,
        backup_created_at: backupContent.created_at,
        practice_id: backupContent.practice_id,
      },
    })

    console.log("[v0] Backup restored successfully:", totalRowsRestored, "rows in", restoredTables.length, "tables")

    return NextResponse.json({
      success: true,
      message: `Backup wurde erfolgreich wiederhergestellt: ${totalRowsRestored} Zeilen in ${restoredTables.length} Tabellen`,
      backupId: backupId,
      tablesRestored: restoredTables.length,
      rowsRestored: totalRowsRestored,
    })
  } catch (error) {
    console.error("[v0] Error restoring backup:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to restore backup" },
      { status: 500 },
    )
  }
}

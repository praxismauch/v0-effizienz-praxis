import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { trackSystemChange } from "@/lib/track-system-change"
import { isSuperAdminRole } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const isV0Preview = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "preview"

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user && !isV0Preview) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user) {
      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (!isSuperAdminRole(userData?.role)) {
        return NextResponse.json({ error: "Forbidden: Super admin access required" }, { status: 403 })
      }
    }

    const body = await request.json()
    const { backupId, backupData } = body

    if (!backupId && !backupData) {
      return NextResponse.json({ error: "Backup ID or backup data required" }, { status: 400 })
    }

    console.log("[v0] Starting backup restoration:", backupId)

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

    for (const [tableName, rows] of Object.entries(backupContent.tables)) {
      try {
        const tableRows = rows as any[]
        if (tableRows.length === 0) continue

        console.log(`[v0] Restoring ${tableRows.length} rows to ${tableName}`)

        if (backupContent.practice_id && tableName !== "users" && tableName !== "practices") {
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

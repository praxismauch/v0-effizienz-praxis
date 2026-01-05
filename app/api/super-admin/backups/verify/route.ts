import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// Verification function to check backup integrity
async function verifyBackupFile(backupUrl: string): Promise<{
  verified: boolean
  errors: string[]
  stats: {
    fileAccessible: boolean
    validJson: boolean
    hasRequiredFields: boolean
    tablesIntact: boolean
    totalRows: number
    totalTables: number
  }
}> {
  const errors: string[] = []
  const stats = {
    fileAccessible: false,
    validJson: false,
    hasRequiredFields: false,
    tablesIntact: false,
    totalRows: 0,
    totalTables: 0,
  }

  try {
    // Step 1: Verify file is accessible
    const response = await fetch(backupUrl, { method: "GET" })
    if (!response.ok) {
      errors.push(`Backup-Datei nicht erreichbar: HTTP ${response.status}`)
      return { verified: false, errors, stats }
    }
    stats.fileAccessible = true

    // Step 2: Verify valid JSON
    let backupData: any
    try {
      const text = await response.text()
      backupData = JSON.parse(text)
      stats.validJson = true
    } catch (parseError) {
      errors.push("Backup-Datei enthält kein gültiges JSON")
      return { verified: false, errors, stats }
    }

    // Step 3: Verify required fields
    if (backupData.version && backupData.tables && backupData.created_at) {
      stats.hasRequiredFields = true
    } else {
      errors.push("Backup-Datei fehlen erforderliche Felder (version, tables, oder created_at)")
    }

    // Step 4: Verify tables have data integrity
    if (backupData.tables && typeof backupData.tables === "object") {
      let tablesValid = true
      stats.totalTables = Object.keys(backupData.tables).length

      for (const [tableName, tableData] of Object.entries(backupData.tables)) {
        if (!Array.isArray(tableData)) {
          errors.push(`Tabelle ${tableName} enthält keine gültigen Array-Daten`)
          tablesValid = false
        }
      }
      if (tablesValid) {
        stats.tablesIntact = true
      }
    }

    // Step 5: Calculate total rows
    stats.totalRows =
      backupData.total_rows ||
      Object.values(backupData.table_row_counts || {}).reduce((sum: number, count: any) => sum + (count || 0), 0)

    const verified = stats.fileAccessible && stats.validJson && stats.hasRequiredFields && stats.tablesIntact

    return { verified, errors, stats }
  } catch (error: any) {
    errors.push(`Verifizierungsfehler: ${error.message}`)
    return { verified: false, errors, stats }
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    // Get all backups that haven't been verified yet
    const { data: backups, error: backupsError } = await supabase
      .from("backups")
      .select("*")
      .not("status", "eq", "verified")
      .order("created_at", { ascending: false })
      .limit(50)

    if (backupsError) {
      throw backupsError
    }

    console.log(`[v0] Batch verifying ${backups?.length || 0} backups...`)

    const results = []

    for (const backup of backups || []) {
      if (!backup.file_url) {
        results.push({ backup_id: backup.id, verified: false, errors: ["Keine Backup-URL"] })
        continue
      }

      try {
        const verification = await verifyBackupFile(backup.file_url)

        // Update backup with verification results
        const updatedMetadata = {
          ...(backup.metadata || {}),
          verification: {
            verified: verification.verified,
            verified_at: new Date().toISOString(),
            stats: verification.stats,
            errors: verification.errors,
          },
        }

        await supabase
          .from("backups")
          .update({
            status: verification.verified ? "verified" : "verification_failed",
            metadata: updatedMetadata,
          })
          .eq("id", backup.id)

        results.push({
          backup_id: backup.id,
          verified: verification.verified,
          errors: verification.errors,
        })
      } catch (error: any) {
        results.push({
          backup_id: backup.id,
          verified: false,
          errors: [error.message],
        })
      }
    }

    const verified = results.filter((r) => r.verified).length
    const failed = results.filter((r) => !r.verified).length

    return NextResponse.json({
      success: true,
      total: results.length,
      verified,
      failed,
      results,
    })
  } catch (error: any) {
    console.error("[v0] Error batch verifying backups:", error)
    return NextResponse.json({ error: error.message || "Batch-Verifizierung fehlgeschlagen" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()
    const { backupId } = body

    if (!backupId) {
      return NextResponse.json({ error: "Backup ID ist erforderlich" }, { status: 400 })
    }

    // Get the backup
    const { data: backup, error: backupError } = await supabase.from("backups").select("*").eq("id", backupId).single()

    if (backupError || !backup) {
      return NextResponse.json({ error: "Backup nicht gefunden" }, { status: 404 })
    }

    if (!backup.file_url) {
      return NextResponse.json({ error: "Keine Backup-URL vorhanden" }, { status: 400 })
    }

    console.log(`[v0] Verifying backup ${backupId}...`)
    const verification = await verifyBackupFile(backup.file_url)

    // Update backup with verification results
    const updatedMetadata = {
      ...(backup.metadata || {}),
      verification: {
        verified: verification.verified,
        verified_at: new Date().toISOString(),
        stats: verification.stats,
        errors: verification.errors,
      },
    }

    await supabase
      .from("backups")
      .update({
        status: verification.verified ? "verified" : "verification_failed",
        metadata: updatedMetadata,
      })
      .eq("id", backupId)

    return NextResponse.json({
      backup_id: backupId,
      verification: {
        verified: verification.verified,
        stats: verification.stats,
        errors: verification.errors,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error verifying backup:", error)
    return NextResponse.json({ error: error.message || "Verifizierung fehlgeschlagen" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// Verification function to check backup integrity
async function verifyBackupFile(backupUrl: string): Promise<{
  verified: boolean
  errors: string[]
  details: {
    fileAccessible: boolean
    validJson: boolean
    hasRequiredFields: boolean
    tablesIntact: boolean
    totalRows: number
  }
}> {
  const errors: string[] = []
  const details = {
    fileAccessible: false,
    validJson: false,
    hasRequiredFields: false,
    tablesIntact: false,
    totalRows: 0,
  }

  try {
    // Step 1: Verify file is accessible
    const response = await fetch(backupUrl, { method: "GET" })
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

    // Step 3: Verify required fields
    if (backupData.version && backupData.tables && backupData.created_at) {
      details.hasRequiredFields = true
    } else {
      errors.push("Backup file missing required fields (version, tables, or created_at)")
    }

    // Step 4: Verify tables have data integrity
    if (backupData.tables && typeof backupData.tables === "object") {
      let tablesValid = true
      for (const [tableName, tableData] of Object.entries(backupData.tables)) {
        if (!Array.isArray(tableData)) {
          errors.push(`Table ${tableName} data is not an array`)
          tablesValid = false
        }
      }
      if (tablesValid) {
        details.tablesIntact = true
      }
    }

    // Step 5: Calculate total rows
    details.totalRows =
      backupData.total_rows ||
      Object.values(backupData.table_row_counts || {}).reduce((sum: number, count: any) => sum + (count || 0), 0)

    const verified = details.fileAccessible && details.validJson && details.hasRequiredFields && details.tablesIntact

    return { verified, errors, details }
  } catch (error: any) {
    errors.push(`Verification error: ${error.message}`)
    return { verified: false, errors, details }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createAdminClient()

    // Get recent backups that haven't been verified or need re-verification
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const { data: backups, error: backupsError } = await supabase
      .from("backups")
      .select("*")
      .gte("created_at", oneDayAgo.toISOString())
      .order("created_at", { ascending: false })

    if (backupsError) throw backupsError

    const results = []

    for (const backup of backups || []) {
      try {
        // Skip if already verified in the last 24 hours
        const metadata = backup.metadata || {}
        if (metadata.verification?.verified_at) {
          const verifiedAt = new Date(metadata.verification.verified_at)
          const hoursSinceVerification = (Date.now() - verifiedAt.getTime()) / (1000 * 60 * 60)
          if (hoursSinceVerification < 24) {
            continue
          }
        }

        const verification = await verifyBackupFile(backup.file_url)

        // Update backup with verification results
        const updatedMetadata = {
          ...metadata,
          verification: {
            verified: verification.verified,
            verified_at: new Date().toISOString(),
            details: verification.details,
            errors: verification.errors,
          },
          last_verification_check: new Date().toISOString(),
        }

        await supabase
          .from("backups")
          .update({
            status: verification.verified
              ? "verified"
              : backup.status === "completed"
                ? "verification_failed"
                : backup.status,
            metadata: updatedMetadata,
          })
          .eq("id", backup.id)

        results.push({
          backup_id: backup.id,
          practice_id: backup.practice_id,
          verified: verification.verified,
          errors: verification.errors,
          total_rows: verification.details.totalRows,
        })

        if (!verification.verified) {
          console.error(`[v0] Backup ${backup.id} verification errors:`, verification.errors)
        }
      } catch (error: any) {
        console.error(`[v0] Error verifying backup ${backup.id}:`, error)
        results.push({
          backup_id: backup.id,
          practice_id: backup.practice_id,
          verified: false,
          errors: [error.message],
        })
      }
    }

    // Calculate summary
    const verified = results.filter((r) => r.verified).length
    const failed = results.filter((r) => !r.verified).length

    return NextResponse.json({
      success: true,
      processed: results.length,
      verified,
      failed,
      results,
    })
  } catch (error: any) {
    console.error("[v0] Error in backup verification cron:", error)
    return NextResponse.json({ error: error.message || "Failed to run backup verification" }, { status: 500 })
  }
}

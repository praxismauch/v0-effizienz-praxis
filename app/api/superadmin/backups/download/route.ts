export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const backupId = req.nextUrl.searchParams.get("id")

    if (!backupId) {
      return NextResponse.json({ error: "Backup ID is required" }, { status: 400 })
    }

    console.log("[v0] Downloading backup:", backupId)

    const { data: backup, error: backupError } = await supabase
      .from("backups")
      .select("*")
      .eq("id", backupId)
      .maybeSingle()

    if (backupError) {
      console.error("[v0] Error fetching backup:", backupError)
      return NextResponse.json({ error: backupError.message }, { status: 500 })
    }

    if (!backup) {
      console.error("[v0] Backup not found")
      return NextResponse.json({ error: "Backup not found" }, { status: 404 })
    }

    // If backup has a file_url (stored in Vercel Blob), redirect to it
    if (backup.file_url) {
      return NextResponse.redirect(backup.file_url)
    }

    // Otherwise, generate the backup data from metadata
    const backupData = {
      id: backup.id,
      practice_id: backup.practice_id,
      backup_type: backup.backup_type,
      backup_scope: backup.backup_scope,
      created_at: backup.created_at,
      status: backup.status,
      metadata: backup.metadata,
      tables_included: backup.tables_included,
      notes: backup.notes,
    }

    // Return as JSON file
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-${backupId}.json"`,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error downloading backup:", error)
    return NextResponse.json({ error: "Failed to download backup" }, { status: 500 })
  }
}

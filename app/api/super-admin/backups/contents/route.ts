import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const backupId = searchParams.get("backupId")

    if (!backupId) {
      return NextResponse.json({ error: "Backup ID required" }, { status: 400 })
    }

    // Fetch backup
    const { data: backup, error: backupError } = await supabase
      .from("backups")
      .select("*")
      .eq("id", backupId)
      .single()

    if (backupError || !backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 })
    }

    // Download and parse backup content
    const response = await fetch(backup.file_url)
    if (!response.ok) {
      throw new Error("Failed to download backup file")
    }
    
    const backupContent = await response.json()

    // Extract tables info
    const tables = Object.entries(backupContent.tables || {}).map(([name, rows]) => ({
      name,
      rowCount: Array.isArray(rows) ? rows.length : 0,
    }))

    // Extract practices from backup
    const practices: Array<{ id: string; name: string; rowCount: number }> = []
    
    if (backupContent.tables?.practices) {
      const practicesData = backupContent.tables.practices as any[]
      for (const practice of practicesData) {
        // Count rows across all tables for this practice
        let totalRows = 1 // Count the practice itself
        for (const [tableName, rows] of Object.entries(backupContent.tables)) {
          if (tableName === "practices") continue
          const tableRows = rows as any[]
          const practiceRows = tableRows.filter((r) => r.practice_id === practice.id)
          totalRows += practiceRows.length
        }
        
        practices.push({
          id: practice.id,
          name: practice.name || `Praxis ${practice.id}`,
          rowCount: totalRows,
        })
      }
    }

    return NextResponse.json({
      backupId: backup.id,
      createdAt: backup.created_at,
      backupScope: backup.backup_scope,
      tables,
      practices,
      metadata: backupContent.metadata || {},
    })
  } catch (error) {
    console.error("[v0] Error fetching backup contents:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch backup contents" },
      { status: 500 },
    )
  }
}

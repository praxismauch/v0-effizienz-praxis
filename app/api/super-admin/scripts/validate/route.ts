import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"
import {
  getEnvironmentInfo,
  containsDangerousPatterns,
  isBlockedInProduction,
  hasMigrationRun,
} from "@/lib/migration-runner"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!isSuperAdminRole(userData?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { scriptName, scriptContent } = await request.json()

    const envInfo = getEnvironmentInfo()
    const warnings = containsDangerousPatterns(scriptContent)
    const blocked = envInfo.isProduction && isBlockedInProduction(scriptContent)
    const alreadyRun = await hasMigrationRun(scriptName)

    return NextResponse.json({
      environment: envInfo,
      warnings,
      blocked,
      alreadyRun,
      canExecute: !blocked && !alreadyRun,
      message: blocked
        ? "Dieses Script ist in der Produktionsumgebung blockiert"
        : alreadyRun
          ? "Dieses Script wurde bereits ausgeführt"
          : "Script kann ausgeführt werden",
    })
  } catch (error) {
    console.error("[v0] Error validating script:", error)
    return NextResponse.json({ error: "Failed to validate script" }, { status: 500 })
  }
}

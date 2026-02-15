/**
 * Supabase Security Monitor
 * Monitors Supabase for anomalous direct access, RLS violations,
 * and suspicious query patterns
 */
import { createAdminClient } from "@/lib/supabase/server"
import { sendSecurityAlert, alertRLSViolation } from "./alerts"
import { appLogger } from "@/lib/logger"

/**
 * Tables that must have RLS enabled for security
 */
const CRITICAL_TABLES = [
  "users",
  "practices",
  "team_members",
  "documents",
  "todos",
  "goals",
  "responsibilities",
  "workflows",
  "calendar_events",
  "notifications",
  "knowledge_base",
  "audit_logs",
]

export interface RLSCheckResult {
  table: string
  rlsEnabled: boolean
  policyCount: number
  policies: Array<{
    name: string
    command: string
    permissive: string
  }>
}

export interface MonitorResult {
  timestamp: string
  rlsChecks: RLSCheckResult[]
  tablesWithoutRLS: string[]
  tablesWithoutPolicies: string[]
  overallSecure: boolean
  warnings: string[]
}

/**
 * Check RLS status for all critical tables
 */
export async function checkRLSStatus(): Promise<RLSCheckResult[]> {
  const results: RLSCheckResult[] = []

  try {
    const supabase = await createAdminClient()

    for (const table of CRITICAL_TABLES) {
      // Check if RLS is enabled
      const { data: rlsData } = await supabase.rpc("check_rls_enabled", {
        table_name: table,
      }).maybeSingle()

      // Get policies for the table
      const { data: policies } = await supabase
        .from("pg_policies")
        .select("policyname, cmd, permissive")
        .eq("tablename", table)
        .eq("schemaname", "public")

      results.push({
        table,
        rlsEnabled: rlsData?.rls_enabled ?? false,
        policyCount: policies?.length || 0,
        policies:
          policies?.map((p: Record<string, string>) => ({
            name: p.policyname,
            command: p.cmd,
            permissive: p.permissive,
          })) || [],
      })
    }
  } catch (error) {
    appLogger.error("security", "Failed to check RLS status", {
      error: error instanceof Error ? error.message : String(error),
    })

    // Fallback: use raw SQL query
    try {
      const supabase = await createAdminClient()

      for (const table of CRITICAL_TABLES) {
        const { data } = await supabase.rpc("exec_sql", {
          query: `
            SELECT 
              c.relrowsecurity as rls_enabled,
              (SELECT count(*) FROM pg_policies WHERE tablename = '${table}' AND schemaname = 'public') as policy_count
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = '${table}' AND n.nspname = 'public'
          `,
        })

        results.push({
          table,
          rlsEnabled: data?.[0]?.rls_enabled ?? false,
          policyCount: data?.[0]?.policy_count ?? 0,
          policies: [],
        })
      }
    } catch (fallbackError) {
      appLogger.error("security", "Failed RLS check fallback", {
        error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
      })
    }
  }

  return results
}

/**
 * Run a complete security monitor scan
 */
export async function runSecurityMonitor(): Promise<MonitorResult> {
  const timestamp = new Date().toISOString()
  const warnings: string[] = []

  // 1. Check RLS status
  const rlsChecks = await checkRLSStatus()

  const tablesWithoutRLS = rlsChecks.filter((r) => !r.rlsEnabled).map((r) => r.table)
  const tablesWithoutPolicies = rlsChecks.filter((r) => r.rlsEnabled && r.policyCount === 0).map((r) => r.table)

  // 2. Generate warnings
  if (tablesWithoutRLS.length > 0) {
    const warning = `Tabellen ohne RLS: ${tablesWithoutRLS.join(", ")}`
    warnings.push(warning)

    await alertRLSViolation(
      tablesWithoutRLS.join(", "),
      `${tablesWithoutRLS.length} kritische Tabellen haben RLS nicht aktiviert`
    )
  }

  if (tablesWithoutPolicies.length > 0) {
    const warning = `Tabellen mit RLS aber ohne Policies: ${tablesWithoutPolicies.join(", ")}`
    warnings.push(warning)

    await sendSecurityAlert({
      severity: "warning",
      title: "RLS-Policies fehlen",
      message: warning,
      details: { tables: tablesWithoutPolicies },
    })
  }

  // 3. Check for common security issues
  try {
    const supabase = await createAdminClient()

    // Check for users with weak roles
    const { data: superAdmins } = await supabase
      .from("users")
      .select("id, email")
      .eq("is_super_admin", true)

    if (superAdmins && superAdmins.length > 5) {
      warnings.push(`Ungewohnlich viele Super-Admins: ${superAdmins.length}`)
    }

    // Check for inactive users still marked as active
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: staleActiveUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .lt("last_login", thirtyDaysAgo)

    if (staleActiveUsers && staleActiveUsers > 10) {
      warnings.push(`${staleActiveUsers} aktive Benutzer ohne Login seit 30 Tagen`)
    }
  } catch (error) {
    warnings.push(`Benutzeruberprufung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`)
  }

  const overallSecure = tablesWithoutRLS.length === 0 && tablesWithoutPolicies.length === 0

  // Log results
  appLogger.info("security", "Security monitor scan complete", {
    overallSecure,
    tablesWithoutRLS: tablesWithoutRLS.length,
    tablesWithoutPolicies: tablesWithoutPolicies.length,
    warnings: warnings.length,
  })

  return {
    timestamp,
    rlsChecks,
    tablesWithoutRLS,
    tablesWithoutPolicies,
    overallSecure,
    warnings,
  }
}

/**
 * RLS Policy Verification Script
 * Verifies that all critical tables have Row Level Security enabled
 * and have appropriate policies configured.
 * 
 * Run with: npx tsx scripts/verify-rls-policies.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")
  process.exit(1)
}

const CRITICAL_TABLES = [
  "users",
  "practices",
  "team_members",
  "documents",
  "document_folders",
  "todos",
  "goals",
  "responsibilities",
  "workflows",
  "workflow_steps",
  "calendar_events",
  "notifications",
  "knowledge_base",
  "audit_logs",
  "chat_messages",
  "chat_sessions",
  "feature_flags",
  "user_sidebar_preferences",
]

interface RLSResult {
  table: string
  rlsEnabled: boolean
  policyCount: number
  policies: string[]
  status: "secure" | "warning" | "critical"
}

async function querySupabase(sql: string): Promise<Record<string, unknown>[]> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!response.ok) {
    // Fallback: use direct Postgres REST API
    const pgResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    })
    if (!pgResponse.ok) {
      throw new Error(`Supabase query failed: ${response.status}`)
    }
    return []
  }

  return response.json()
}

async function checkTableRLS(tableName: string): Promise<RLSResult> {
  try {
    // Check RLS enabled status
    const rlsCheckSQL = `
      SELECT relrowsecurity as rls_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = '${tableName}' AND n.nspname = 'public'
    `

    // Check policies
    const policiesSQL = `
      SELECT policyname, cmd, permissive
      FROM pg_policies
      WHERE tablename = '${tableName}' AND schemaname = 'public'
    `

    // Execute via Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: rlsCheckSQL }),
    })

    let rlsEnabled = false
    if (response.ok) {
      const data = await response.json()
      rlsEnabled = data?.[0]?.rls_enabled ?? false
    }

    const policiesResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: policiesSQL }),
    })

    let policies: string[] = []
    let policyCount = 0
    if (policiesResponse.ok) {
      const data = await policiesResponse.json()
      policyCount = data?.length || 0
      policies = data?.map((p: Record<string, string>) => `${p.policyname} (${p.cmd})`) || []
    }

    let status: "secure" | "warning" | "critical" = "secure"
    if (!rlsEnabled) status = "critical"
    else if (policyCount === 0) status = "warning"

    return { table: tableName, rlsEnabled, policyCount, policies, status }
  } catch {
    return {
      table: tableName,
      rlsEnabled: false,
      policyCount: 0,
      policies: [],
      status: "critical",
    }
  }
}

async function main() {
  console.log("=== RLS Policy Verification ===")
  console.log(`Checking ${CRITICAL_TABLES.length} critical tables...\n`)

  const results: RLSResult[] = []
  let criticalCount = 0
  let warningCount = 0
  let secureCount = 0

  for (const table of CRITICAL_TABLES) {
    const result = await checkTableRLS(table)
    results.push(result)

    const icon = result.status === "secure" ? "[OK]" : result.status === "warning" ? "[WARN]" : "[CRIT]"
    console.log(
      `${icon} ${result.table.padEnd(35)} RLS: ${result.rlsEnabled ? "ON " : "OFF"} | Policies: ${result.policyCount}`
    )

    if (result.status === "critical") criticalCount++
    else if (result.status === "warning") warningCount++
    else secureCount++
  }

  console.log("\n=== Summary ===")
  console.log(`Secure:   ${secureCount}/${CRITICAL_TABLES.length}`)
  console.log(`Warnings: ${warningCount}`)
  console.log(`Critical: ${criticalCount}`)

  if (criticalCount > 0) {
    console.log("\n[CRITICAL] Tables without RLS:")
    results
      .filter((r) => !r.rlsEnabled)
      .forEach((r) => console.log(`  - ${r.table}`))
  }

  if (warningCount > 0) {
    console.log("\n[WARNING] Tables with RLS but no policies:")
    results
      .filter((r) => r.rlsEnabled && r.policyCount === 0)
      .forEach((r) => console.log(`  - ${r.table}`))
  }

  console.log("\n=== Verification Complete ===")
  process.exit(criticalCount > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error("Verification failed:", err)
  process.exit(1)
})

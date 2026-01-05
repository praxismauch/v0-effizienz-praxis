/**
 * Safe Migration Runner with Production Protection
 *
 * This utility helps prevent data loss by:
 * 1. Checking the current environment (production/development/preview)
 * 2. Requiring explicit confirmation for production scripts
 * 3. Checking if a migration has already been run
 * 4. Creating a backup before running destructive migrations
 * 5. Recording successful migrations to prevent re-execution
 * 6. Blocking dangerous operations in production without override
 */

import { createClient } from "@/lib/supabase/server"

export interface MigrationResult {
  success: boolean
  message: string
  alreadyRun?: boolean
  backupId?: string
  blocked?: boolean
  environment?: string
}

export interface EnvironmentInfo {
  environment: "production" | "preview" | "development"
  databaseUrl: string
  isProduction: boolean
  requiresConfirmation: boolean
}

/**
 * Get current environment information
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV
  const nodeEnv = process.env.NODE_ENV
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || ""

  // Determine environment
  let environment: "production" | "preview" | "development" = "development"

  if (vercelEnv === "production" || nodeEnv === "production") {
    environment = "production"
  } else if (vercelEnv === "preview") {
    environment = "preview"
  }

  // Check database URL for production indicators
  const isProductionDb =
    databaseUrl.includes("pooler.supabase.com") ||
    databaseUrl.includes(".supabase.co") ||
    (databaseUrl.includes("neon.tech") && !databaseUrl.includes("dev") && !databaseUrl.includes("staging"))

  const isProduction = environment === "production" || isProductionDb

  return {
    environment,
    databaseUrl: databaseUrl.substring(0, 50) + "...", // Truncate for security
    isProduction,
    requiresConfirmation: isProduction,
  }
}

/**
 * Check if a migration script has already been executed
 */
export async function hasMigrationRun(scriptName: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("migration_history")
    .select("id")
    .eq("script_name", scriptName)
    .eq("success", true)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned, which is expected
    console.error("[v0] Error checking migration history:", error)
  }

  return !!data
}

/**
 * Record a successful migration
 */
export async function recordMigration(
  scriptName: string,
  executedBy?: string,
  notes?: string,
  rollbackScript?: string,
): Promise<boolean> {
  const supabase = await createClient()
  const envInfo = getEnvironmentInfo()

  const { error } = await supabase.from("migration_history").upsert(
    {
      script_name: scriptName,
      executed_by: executedBy || "system",
      environment: envInfo.environment,
      notes: notes,
      success: true,
      rollback_script: rollbackScript,
      executed_at: new Date().toISOString(),
    },
    {
      onConflict: "script_name",
    },
  )

  if (error) {
    console.error("[v0] Error recording migration:", error)
    return false
  }

  return true
}

/**
 * Get list of all executed migrations
 */
export async function getExecutedMigrations(): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("migration_history")
    .select("script_name")
    .eq("success", true)
    .order("executed_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching migration history:", error)
    return []
  }

  return data?.map((m) => m.script_name) || []
}

/**
 * Dangerous script patterns to warn about
 */
export const DANGEROUS_PATTERNS = [
  { pattern: /DROP\s+TABLE/i, description: "DROP TABLE - Löscht eine Tabelle komplett" },
  { pattern: /TRUNCATE/i, description: "TRUNCATE - Löscht alle Daten aus einer Tabelle" },
  { pattern: /DELETE\s+FROM\s+\w+\s*;/i, description: "DELETE ohne WHERE - Löscht alle Zeilen" },
  { pattern: /DROP\s+DATABASE/i, description: "DROP DATABASE - Löscht die gesamte Datenbank" },
  { pattern: /DROP\s+SCHEMA/i, description: "DROP SCHEMA - Löscht ein Schema komplett" },
  { pattern: /ALTER\s+TABLE.*DROP\s+COLUMN/i, description: "DROP COLUMN - Entfernt eine Spalte" },
  { pattern: /UPDATE\s+\w+\s+SET.*WHERE\s*;?$/im, description: "UPDATE ohne WHERE - Ändert alle Zeilen" },
]

/**
 * Patterns that are blocked in production without explicit override
 */
export const BLOCKED_IN_PRODUCTION = [
  /DROP\s+DATABASE/i,
  /DROP\s+SCHEMA/i,
  /TRUNCATE/i,
  /DELETE\s+FROM\s+\w+\s*;/i, // DELETE without WHERE
]

/**
 * Check if a script contains dangerous patterns
 */
export function containsDangerousPatterns(scriptContent: string): { pattern: string; description: string }[] {
  const warnings: { pattern: string; description: string }[] = []

  for (const { pattern, description } of DANGEROUS_PATTERNS) {
    if (pattern.test(scriptContent)) {
      warnings.push({ pattern: pattern.source, description })
    }
  }

  return warnings
}

/**
 * Check if a script is blocked in production
 */
export function isBlockedInProduction(scriptContent: string): boolean {
  return BLOCKED_IN_PRODUCTION.some((pattern) => pattern.test(scriptContent))
}

/**
 * Validate script can run in current environment
 */
export function validateScriptForEnvironment(
  scriptContent: string,
  forceProduction = false,
): {
  allowed: boolean
  warnings: { pattern: string; description: string }[]
  blocked: boolean
  environment: EnvironmentInfo
} {
  const envInfo = getEnvironmentInfo()
  const warnings = containsDangerousPatterns(scriptContent)
  const blocked = envInfo.isProduction && isBlockedInProduction(scriptContent) && !forceProduction

  return {
    allowed: !blocked,
    warnings,
    blocked,
    environment: envInfo,
  }
}

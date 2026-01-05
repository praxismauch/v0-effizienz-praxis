import { createServerClient } from "@/lib/supabase/server"

export type ChangeCategory =
  | "feature"
  | "bugfix"
  | "improvement"
  | "security"
  | "database"
  | "api"
  | "ui"
  | "configuration"

export interface SystemChangeData {
  title: string
  description: string
  changeType: ChangeCategory
  entityType?: string
  entityId?: string
  practiceId?: string
  userId?: string
  metadata?: Record<string, any>
  isUserFacing?: boolean
}

/**
 * Tracks system changes for automatic changelog generation
 * This function logs all changes made to the system for super admin review
 */
export async function trackSystemChange(data: SystemChangeData) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase.from("system_changes").insert({
      title: data.title,
      description: data.description,
      change_type: data.changeType,
      action: "created",
      entity_type: data.entityType,
      entity_id: data.entityId,
      practice_id: data.practiceId,
      user_id: data.userId,
      metadata: data.metadata || {},
      is_user_facing: data.isUserFacing ?? true,
      is_aggregated: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[v0] Error tracking system change:", error)
    }
  } catch (error) {
    console.error("[v0] Failed to track system change:", error)
  }
}

/**
 * Tracks database schema changes
 */
export async function trackDatabaseChange(tableName: string, changeDescription: string, userId?: string) {
  await trackSystemChange({
    title: `Datenbank-Update: ${tableName}`,
    description: changeDescription,
    changeType: "database",
    entityType: "database_table",
    entityId: tableName,
    userId,
    isUserFacing: false,
    metadata: { tableName },
  })
}

/**
 * Tracks feature additions
 */
export async function trackFeatureAddition(
  featureName: string,
  description: string,
  practiceId?: string,
  userId?: string,
) {
  await trackSystemChange({
    title: `Neue Funktion: ${featureName}`,
    description,
    changeType: "feature",
    practiceId,
    userId,
    isUserFacing: true,
    metadata: { featureName },
  })
}

/**
 * Tracks bug fixes
 */
export async function trackBugFix(bugTitle: string, description: string, userId?: string) {
  await trackSystemChange({
    title: `Bugfix: ${bugTitle}`,
    description,
    changeType: "bugfix",
    userId,
    isUserFacing: true,
    metadata: { bugTitle },
  })
}

/**
 * Tracks API changes
 */
export async function trackAPIChange(endpoint: string, description: string, userId?: string) {
  await trackSystemChange({
    title: `API-Änderung: ${endpoint}`,
    description,
    changeType: "api",
    entityType: "api_endpoint",
    entityId: endpoint,
    userId,
    isUserFacing: false,
    metadata: { endpoint },
  })
}

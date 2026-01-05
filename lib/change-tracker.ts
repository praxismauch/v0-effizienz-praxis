"use server"

import { createClient } from "@/lib/supabase/server"

export type ChangeType = "feature" | "update" | "fix" | "config" | "security" | "performance"
export type EntityType =
  | "user"
  | "patient"
  | "appointment"
  | "parameter"
  | "form"
  | "workflow"
  | "team"
  | "document"
  | "knowledge"
  | "analytics"
  | "practice"
  | "system"
export type Action = "create" | "update" | "delete" | "configure"

interface TrackChangeParams {
  changeType: ChangeType
  entityType: EntityType
  entityId?: string
  action: Action
  title: string
  description?: string
  metadata?: Record<string, any>
  isUserFacing?: boolean
  practiceId?: string
}

export async function trackSystemChange(params: TrackChangeParams) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    // Insert change record
    const { error } = await supabase.from("system_changes").insert({
      practice_id: params.practiceId || null,
      user_id: user.id,
      change_type: params.changeType,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      action: params.action,
      title: params.title,
      description: params.description || null,
      metadata: params.metadata || null,
      is_user_facing: params.isUserFacing !== false,
      is_aggregated: false,
    })

    if (error) {
      console.error("[v0] Track change error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Track change exception:", error)
    return { success: false, error: "Failed to track change" }
  }
}

export async function getUnaggregatedChanges(startDate?: string, endDate?: string) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from("system_changes")
      .select("*")
      .eq("is_aggregated", false)
      .eq("is_user_facing", true)
      .order("created_at", { ascending: false })

    if (startDate) {
      query = query.gte("created_at", startDate)
    }
    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Get changes error:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("[v0] Get changes exception:", error)
    return { success: false, error: "Failed to fetch changes", data: [] }
  }
}

export async function markChangesAsAggregated(changeIds: string[]) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("system_changes").update({ is_aggregated: true }).in("id", changeIds)

    if (error) {
      console.error("[v0] Mark aggregated error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Mark aggregated exception:", error)
    return { success: false, error: "Failed to mark changes" }
  }
}

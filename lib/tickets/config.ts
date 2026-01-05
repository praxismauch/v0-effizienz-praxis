/**
 * Ticket Configuration Service
 *
 * Server-side utilities for fetching ticket configurations.
 * Use these in Server Components and API routes.
 */

import { createClient } from "@/lib/supabase/server"
import type { TicketConfig, TicketStatusConfig, TicketPriorityConfig, TicketTypeConfig } from "./types"

/**
 * Fetch all ticket configurations from database
 *
 * @returns {Promise<TicketConfig>} - Complete configuration object
 */
export async function getTicketConfig(): Promise<TicketConfig> {
  const supabase = await createClient()

  const [statusesResult, prioritiesResult, typesResult] = await Promise.all([
    supabase.from("ticket_statuses").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("ticket_priorities").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("ticket_types").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
  ])

  if (statusesResult.error) {
    console.error("[v0] Error fetching ticket statuses:", statusesResult.error)
    throw new Error("Failed to fetch ticket statuses")
  }

  if (prioritiesResult.error) {
    console.error("[v0] Error fetching ticket priorities:", prioritiesResult.error)
    throw new Error("Failed to fetch ticket priorities")
  }

  if (typesResult.error) {
    console.error("[v0] Error fetching ticket types:", typesResult.error)
    throw new Error("Failed to fetch ticket types")
  }

  return {
    statuses: statusesResult.data as TicketStatusConfig[],
    priorities: prioritiesResult.data as TicketPriorityConfig[],
    types: typesResult.data as TicketTypeConfig[],
  }
}

/**
 * Fetch only ticket statuses
 */
export async function getTicketStatuses(): Promise<TicketStatusConfig[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("ticket_statuses")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching ticket statuses:", error)
    throw new Error("Failed to fetch ticket statuses")
  }

  return data as TicketStatusConfig[]
}

/**
 * Fetch only ticket priorities
 */
export async function getTicketPriorities(): Promise<TicketPriorityConfig[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("ticket_priorities")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching ticket priorities:", error)
    throw new Error("Failed to fetch ticket priorities")
  }

  return data as TicketPriorityConfig[]
}

/**
 * Fetch only ticket types
 */
export async function getTicketTypes(): Promise<TicketTypeConfig[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching ticket types:", error)
    throw new Error("Failed to fetch ticket types")
  }

  return data as TicketTypeConfig[]
}

/**
 * Get ticket configuration by specific value
 */
export async function getTicketStatusByValue(value: string): Promise<TicketStatusConfig | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("ticket_statuses")
    .select("*")
    .eq("value", value)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error("[v0] Error fetching ticket status:", error)
    return null
  }

  return data as TicketStatusConfig
}

/**
 * Check if a status value exists and is active
 */
export async function isValidStatus(value: string): Promise<boolean> {
  const status = await getTicketStatusByValue(value)
  return status !== null
}

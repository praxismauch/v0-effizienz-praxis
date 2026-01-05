/**
 * Soft Delete Utility Functions
 *
 * This module provides utility functions for working with soft-deleted records.
 * All database operations should use these utilities to respect soft deletes.
 */

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Soft delete a record by setting deleted_at to NOW()
 * @param table - The table name
 * @param id - The record ID
 * @returns The soft-deleted record
 */
export async function softDelete(table: string, id: string) {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Restore a soft-deleted record by setting deleted_at to NULL
 * @param table - The table name
 * @param id - The record ID
 * @returns The restored record
 */
export async function restoreDeleted(table: string, id: string) {
  const supabase = await createAdminClient()

  const { data, error } = await supabase.from(table).update({ deleted_at: null }).eq("id", id).select().single()

  if (error) throw error
  return data
}

/**
 * Get all soft-deleted records from a table
 * @param table - The table name
 * @returns Array of soft-deleted records
 */
export async function getDeletedRecords(table: string) {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Permanently delete records that have been soft-deleted for more than X days
 * @param table - The table name
 * @param daysOld - Number of days (default: 30)
 * @returns Number of records permanently deleted
 */
export async function permanentlyDeleteOldRecords(table: string, daysOld = 30) {
  const supabase = await createAdminClient()

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.setDate(cutoffDate.getDate() - daysOld))

  const { data, error } = await supabase.from(table).delete().lt("deleted_at", cutoffDate.toISOString()).select()

  if (error) throw error
  return data?.length || 0
}

/**
 * Add soft delete filter to Supabase query builder
 * Usage: query.select('*').filter(excludeDeleted())
 */
export function excludeDeleted() {
  return { deleted_at: { is: null } }
}

/**
 * Count active (non-deleted) records in a table
 * @param table - The table name
 * @returns Count of active records
 */
export async function countActiveRecords(table: string) {
  const supabase = await createAdminClient()

  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true }).is("deleted_at", null)

  if (error) throw error
  return count || 0
}

/**
 * Count soft-deleted records in a table
 * @param table - The table name
 * @returns Count of soft-deleted records
 */
export async function countDeletedRecords(table: string) {
  const supabase = await createAdminClient()

  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .not("deleted_at", "is", null)

  if (error) throw error
  return count || 0
}

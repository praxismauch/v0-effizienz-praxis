/**
 * Helper functions to prevent "operator does not exist: text = uuid" errors
 *
 * PostgreSQL comparison errors occur when text columns are compared with values
 * that PostgreSQL interprets as UUID literals. These helpers ensure all ID values
 * are explicitly converted to strings before database queries.
 */

/**
 * Ensure ID parameters are always treated as strings to prevent UUID comparison errors
 */
export function ensureString(id: string | number | null | undefined): string {
  if (id === null || id === undefined) {
    return ""
  }
  return String(id)
}

/**
 * Helper to safely build Supabase queries with string ID comparisons
 *
 * @example
 * ```typescript
 * let query = supabase.from("teams").select("*")
 * query = safeEq(query, "practice_id", params.practiceId)
 * ```
 */
export function safeEq<T>(query: any, column: string, value: string | number | null | undefined): any {
  return query.eq(column, ensureString(value))
}

/**
 * Convert multiple ID parameters to strings at once
 *
 * @example
 * ```typescript
 * const { practiceId, teamId, userId } = ensureStrings({
 *   practiceId: params.practiceId,
 *   teamId: params.teamId,
 *   userId: params.userId
 * })
 * ```
 */
export function ensureStrings<T extends Record<string, any>>(params: T): { [K in keyof T]: string } {
  const result: any = {}
  for (const key in params) {
    result[key] = ensureString(params[key])
  }
  return result
}

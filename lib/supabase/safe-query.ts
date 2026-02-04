/**
 * Safely executes a Supabase query and handles rate limiting errors
 * When Supabase returns "Too Many Requests" as plain text, it causes JSON parse errors
 * This wrapper catches those errors and returns graceful fallbacks
 */

interface ErrorLike {
  message?: string
  name?: string
  body?: string
  code?: string
}

interface SupabaseError {
  message: string
  code: string
}

interface QueryResult<T> {
  data: T | null
  error: SupabaseError | null
}

export function isRateLimitError(error: unknown): boolean {
  if (!error) return false

  // Check for SyntaxError (JSON parse failure from "Too Many Requests" text)
  if (error instanceof SyntaxError) return true

  const errorObj = error as ErrorLike
  const errorString = String(error)
  const errorMessage = errorObj?.message || ""
  const errorName = errorObj?.name || ""
  const errorBody = errorObj?.body || ""

  return (
    errorName === "SyntaxError" ||
    errorString.includes("Too Many") ||
    errorString.includes("Unexpected token") ||
    errorString.includes("is not valid JSON") ||
    errorString.includes("rate limit") ||
    errorString.includes("429") ||
    errorMessage.includes("Too Many") ||
    errorMessage.includes("Unexpected token") ||
    errorMessage.includes("is not valid JSON") ||
    errorMessage.includes("Too Many R") ||
    errorMessage.includes("rate limit") ||
    errorMessage.includes("429") ||
    errorBody.includes("Too Many") ||
    errorBody.includes("rate limit")
  )
}

export function isRateLimitResponse(response: { error: unknown }): boolean {
  if (!response.error) return false
  return isRateLimitError(response.error)
}

export async function safeSupabaseQuery<T>(
  queryFn: () => Promise<QueryResult<T>>,
  fallback: T,
): Promise<QueryResult<T>> {
  try {
    const result = await queryFn()

    if (result.error && isRateLimitError(result.error)) {
      // Rate limit detected, returning fallback
      return { data: fallback, error: { message: "Rate limited", code: "RATE_LIMITED" } }
    }

    return result
  } catch (error) {
    if (isRateLimitError(error)) {
      // Rate limit detected, returning fallback
      return { data: fallback, error: { message: "Rate limited", code: "RATE_LIMITED" } }
    }

    // Return fallback for any other unexpected errors instead of throwing
    console.error("Unexpected error in safeSupabaseQuery:", error)
    return { data: fallback, error: { message: String(error), code: "UNKNOWN_ERROR" } }
  }
}

/**
 * Safely executes multiple Supabase queries in parallel with rate limit protection
 */
export async function safeSupabaseQueries<T extends Record<string, unknown>>(
  queries: Record<keyof T, () => Promise<QueryResult<T[keyof T]>>>,
  fallbacks: T,
): Promise<Record<keyof T, QueryResult<T[keyof T]>>> {
  const results = {} as Record<keyof T, QueryResult<T[keyof T]>>

  await Promise.all(
    Object.entries(queries).map(async ([key, queryFn]) => {
      const typedKey = key as keyof T
      try {
        results[typedKey] = await (queryFn as () => Promise<QueryResult<T[keyof T]>>)()
      } catch (error) {
        if (isRateLimitError(error)) {
          console.warn(`Rate limit detected for ${key}, using fallback`)
          results[typedKey] = { data: fallbacks[typedKey], error: { message: "Rate limited", code: "RATE_LIMITED" } }
        } else {
          console.error(`Unexpected error for ${key}:`, error)
          results[typedKey] = { data: fallbacks[typedKey], error: { message: String(error), code: "UNKNOWN_ERROR" } }
        }
      }
    }),
  )

  return results
}

/**
 * Wraps a Supabase client creation with rate limit protection
 */
export async function safeCreateClient<T>(
  createFn: () => Promise<T>,
  errorMessage = "Failed to create Supabase client",
): Promise<T | null> {
  try {
    return await createFn()
  } catch (error) {
    if (isRateLimitError(error)) {
      // Rate limited when creating client
      return null
    }
    console.error(`${errorMessage}:`, error)
    return null
  }
}

/**
 * Delay helper for rate limit backoff
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Execute queries sequentially with delays to avoid rate limiting
 */
export async function batchedQueries<T>(queries: Array<() => Promise<T>>, delayMs = 100): Promise<T[]> {
  const results: T[] = []
  for (let i = 0; i < queries.length; i++) {
    if (i > 0) {
      await delay(delayMs)
    }
    results.push(await queries[i]())
  }
  return results
}

/**
 * Retry a query with exponential backoff
 */
export async function retryWithBackoff<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries = 3,
  initialDelay = 1000,
): Promise<{ data: T | null; error: any }> {
  let lastError: any = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await queryFn()
      if (!result.error || result.error.code === "RATE_LIMITED") {
        return result
      }

      if (isRateLimitError(result.error)) {
        console.warn(`Rate limit on retry ${i + 1}, backing off...`)
        lastError = result.error
        if (i < maxRetries - 1) {
          await delay(initialDelay * Math.pow(2, i))
        }
        continue
      }

      lastError = result.error
    } catch (error) {
      if (isRateLimitError(error)) {
        console.warn(`Rate limit on retry ${i + 1}, backing off...`)
      }
      lastError = error
    }

    if (i < maxRetries - 1) {
      await delay(initialDelay * Math.pow(2, i))
    }
  }

  return { data: null, error: lastError }
}

/**
 * Error codes that indicate a table doesn't exist
 */
const TABLE_NOT_FOUND_CODES = ["PGRST205", "42P01"]

/**
 * Checks if an error indicates a missing table
 */
export function isTableMissingError(error: unknown): boolean {
  if (!error) return false
  const errorObj = error as ErrorLike
  const errorCode = errorObj?.code || ""
  const errorMessage = errorObj?.message || String(error)
  
  return (
    TABLE_NOT_FOUND_CODES.includes(errorCode) ||
    errorMessage.includes("Could not find") ||
    errorMessage.includes("does not exist") ||
    errorMessage.includes("in the schema cache")
  )
}

/**
 * Wraps a Supabase query to handle missing table errors gracefully
 * Returns fallback data instead of throwing for missing tables
 */
export async function safeQueryWithTableFallback<T>(
  queryFn: () => Promise<QueryResult<T>>,
  fallback: T,
): Promise<QueryResult<T>> {
  try {
    const result = await queryFn()

    if (result.error) {
      if (isTableMissingError(result.error)) {
        return { data: fallback, error: null }
      }
      if (isRateLimitError(result.error)) {
        return { data: fallback, error: { message: "Rate limited", code: "RATE_LIMITED" } }
      }
    }

    return result
  } catch (error) {
    if (isTableMissingError(error)) {
      return { data: fallback, error: null }
    }
    if (isRateLimitError(error)) {
      return { data: fallback, error: { message: "Rate limited", code: "RATE_LIMITED" } }
    }
    return { data: fallback, error: { message: String(error), code: "UNKNOWN_ERROR" } }
  }
}

/**
 * Handles Supabase errors and returns appropriate HTTP status codes
 */
export function getHttpStatusForError(error: unknown): number {
  if (!error) return 200
  
  const errorObj = error as ErrorLike
  const code = errorObj?.code || ""
  
  if (isTableMissingError(error)) return 503
  if (isRateLimitError(error)) return 429
  if (code === "PGRST301" || code === "401") return 401
  if (code === "23505") return 409 // Duplicate
  if (code === "23503") return 400 // Foreign key violation
  
  return 500
}

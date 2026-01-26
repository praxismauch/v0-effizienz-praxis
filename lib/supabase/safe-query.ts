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
      console.warn("[v0] Rate limit detected in query result, returning fallback data")
      return { data: fallback, error: { message: "Rate limited", code: "RATE_LIMITED" } }
    }

    return result
  } catch (error) {
    if (isRateLimitError(error)) {
      console.warn("[v0] Rate limit detected, returning fallback data")
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
      console.warn("[v0] Rate limited when creating Supabase client")
      return null
    }
    console.error(`[v0] ${errorMessage}:`, error)
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
        console.warn(`[v0] Rate limit on retry ${i + 1}, backing off...`)
        lastError = result.error
        if (i < maxRetries - 1) {
          await delay(initialDelay * Math.pow(2, i))
        }
        continue
      }

      lastError = result.error
    } catch (error) {
      if (isRateLimitError(error)) {
        console.warn(`[v0] Rate limit on retry ${i + 1}, backing off...`)
      }
      lastError = error
    }

    if (i < maxRetries - 1) {
      await delay(initialDelay * Math.pow(2, i))
    }
  }

  return { data: null, error: lastError }
}

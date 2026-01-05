/**
 * Rate limit handler for Supabase queries
 * Provides retry logic and graceful error handling for rate-limited requests
 */

// Simple in-memory request tracker to prevent flooding
const requestTimestamps: number[] = []
const MAX_REQUESTS_PER_SECOND = 10
const WINDOW_MS = 1000

function shouldThrottle(): boolean {
  const now = Date.now()
  // Remove timestamps older than the window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - WINDOW_MS) {
    requestTimestamps.shift()
  }
  return requestTimestamps.length >= MAX_REQUESTS_PER_SECOND
}

function trackRequest(): void {
  requestTimestamps.push(Date.now())
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (!error) return false
  const message = (error as { message?: string })?.message || String(error)
  return (
    error instanceof SyntaxError ||
    message.includes("Too Many") ||
    message.includes("Unexpected token") ||
    message.includes("is not valid JSON") ||
    message.includes("rate limit") ||
    message.includes("429")
  )
}

/**
 * Execute a Supabase query with automatic retry on rate limit
 */
export async function withRateLimitRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>,
  options: {
    maxRetries?: number
    initialDelay?: number
    fallbackData?: T
    context?: string
  } = {},
): Promise<{ data: T | null; error: unknown }> {
  const { maxRetries = 3, initialDelay = 500, fallbackData = null, context = "query" } = options

  // Throttle if too many requests
  if (shouldThrottle()) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  trackRequest()

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFn()

      // Check if the error message contains rate limit indicators
      if (result.error) {
        if (isRateLimitError(result.error) && attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
      }

      return result
    } catch (error: unknown) {
      if (isRateLimitError(error) && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // Return fallback data on final failure
      if (attempt === maxRetries) {
        return { data: fallbackData, error: { message: `Rate limited after ${maxRetries} retries: ${context}` } }
      }

      throw error
    }
  }

  return { data: fallbackData, error: { message: "Max retries exceeded" } }
}

/**
 * Safe JSON response handler that checks for rate limit text responses
 */
export async function safeJsonResponse<T>(
  response: Response,
  fallbackData?: T,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const text = await response.text()

    // Check for rate limit text response
    if (text.startsWith("Too Many") || text.includes("Too Many Requests")) {
      return {
        data: fallbackData ?? null,
        error: "Rate limited",
      }
    }

    // Check if it's valid JSON
    if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
      return {
        data: fallbackData ?? null,
        error: `Invalid response: ${text.substring(0, 50)}`,
      }
    }

    const data = JSON.parse(text) as T
    return { data, error: null }
  } catch (e) {
    return {
      data: fallbackData ?? null,
      error: `JSON parse error: ${e}`,
    }
  }
}

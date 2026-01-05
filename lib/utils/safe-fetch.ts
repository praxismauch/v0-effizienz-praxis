/**
 * Safe fetch wrapper that handles rate limiting and JSON parsing errors gracefully
 */
export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit,
  defaultValue: T = [] as unknown as T,
): Promise<{ data: T; error: string | null; isRateLimited: boolean }> {
  try {
    const response = await fetch(url, options)

    // Handle rate limiting
    if (response.status === 429) {
      console.warn(`[safeFetch] Rate limited: ${url}`)
      return { data: defaultValue, error: "Rate limited", isRateLimited: true }
    }

    // Get response text first
    const text = await response.text()

    // Check for rate limit in response body
    if (text.includes("Too Many") || text.includes("rate limit")) {
      console.warn(`[safeFetch] Rate limit detected in response: ${url}`)
      return { data: defaultValue, error: "Rate limited", isRateLimited: true }
    }

    // Try to parse JSON
    try {
      const data = text ? JSON.parse(text) : defaultValue

      if (!response.ok) {
        return { data: defaultValue, error: data.error || `HTTP ${response.status}`, isRateLimited: false }
      }

      return { data, error: null, isRateLimited: false }
    } catch (parseError) {
      console.error(`[safeFetch] JSON parse error for ${url}:`, text.substring(0, 100))
      return { data: defaultValue, error: "Invalid JSON response", isRateLimited: false }
    }
  } catch (networkError: any) {
    console.error(`[safeFetch] Network error for ${url}:`, networkError.message)
    return { data: defaultValue, error: networkError.message, isRateLimited: false }
  }
}

/**
 * Fetch with automatic retry for rate-limited requests
 */
export async function fetchWithRetry<T = any>(
  url: string,
  options?: RequestInit,
  defaultValue: T = [] as unknown as T,
  maxRetries = 3,
  baseDelayMs = 1000,
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data, error, isRateLimited } = await safeFetch<T>(url, options, defaultValue)

    if (!isRateLimited || attempt === maxRetries - 1) {
      return data
    }

    // Exponential backoff for rate-limited requests
    const delay = baseDelayMs * Math.pow(2, attempt)
    console.log(`[fetchWithRetry] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  return defaultValue
}

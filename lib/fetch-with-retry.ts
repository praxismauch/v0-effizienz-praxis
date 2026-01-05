interface FetchWithRetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
}

export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryOptions?: FetchWithRetryOptions,
): Promise<Response> {
  const { maxRetries = 5, baseDelay = 1000, maxDelay = 10000 } = retryOptions || {}

  let lastError: Error | null = null
  let lastResponse: Response | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      lastResponse = response

      if (response.status === 429 || response.status === 503) {
        if (attempt < maxRetries) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
      }

      return response
    } catch (error) {
      lastError = error as Error

      if (attempt < maxRetries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  if (lastResponse) {
    return lastResponse
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`)
}

// Helper to safely parse JSON with fallback
export async function safeJsonParse<T>(response: Response, fallback: T): Promise<T> {
  try {
    const text = await response.text()
    if (!text || text.trim() === "" || text.startsWith("Too Many") || text.includes('"retryable":true')) {
      return fallback
    }
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === "object" && "error" in parsed) {
      return fallback
    }
    return parsed as T
  } catch {
    return fallback
  }
}

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
  const { maxRetries = 3, baseDelay = 300, maxDelay = 2000 } = retryOptions || {}

  let lastError: Error | null = null
  let lastResponse: Response | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      lastResponse = response

      if (response.status === 429 || response.status === 503) {
        if (attempt < maxRetries) {
          const retryAfter = response.headers.get("Retry-After")
          const jitter = Math.random() * 200
          const delay = retryAfter
            ? Math.min(Number.parseInt(retryAfter, 10) * 1000, maxDelay) + jitter
            : Math.min(baseDelay * Math.pow(2, attempt), maxDelay) + jitter
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
      }

      return response
    } catch (error) {
      lastError = error as Error

      if (attempt < maxRetries) {
        const jitter = Math.random() * 200
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay) + jitter
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  if (lastResponse) {
    return lastResponse
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`)
}

export async function safeJsonParse<T>(response: Response, fallback: T): Promise<T> {
  try {
    // Clone response in case we need to read it multiple times
    const text = await response.text()

    // Check for empty or error responses
    if (!text || text.trim() === "") {
      return fallback
    }

    // Check for rate limit text responses
    if (text.startsWith("Too Many") || text.includes("Too Many Requests")) {
      return fallback
    }

    // Check for HTML error pages
    if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
      return fallback
    }

    const parsed = JSON.parse(text)

    // Check for error objects with retryable flag
    if (parsed && typeof parsed === "object" && "error" in parsed && "retryable" in parsed) {
      return fallback
    }

    return parsed as T
  } catch {
    return fallback
  }
}

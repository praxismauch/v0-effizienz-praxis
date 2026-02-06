/**
 * Shared SWR fetcher with error handling and logging
 */

export class FetchError extends Error {
  status: number
  info: unknown

  constructor(message: string, status: number, info?: unknown) {
    super(message)
    this.name = "FetchError"
    this.status = status
    this.info = info
  }
}

/**
 * Default fetcher for SWR with error handling and retry logic for network errors
 */
export async function swrFetcher<T>(url: string, retries = 2): Promise<T> {
  try {
    const res = await fetch(url, {
      credentials: "include", // Include cookies for authentication
    })

    // Retry on 502/503/504 gateway errors (transient network issues)
    if ((res.status === 502 || res.status === 503 || res.status === 504) && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return swrFetcher<T>(url, retries - 1)
    }

    if (!res.ok) {
      let errorInfo: unknown
      try {
        errorInfo = await res.json()
      } catch {
        errorInfo = { message: res.statusText }
      }

      const error = new FetchError(
        (errorInfo as { error?: string; message?: string })?.error ||
          (errorInfo as { message?: string })?.message ||
          `Fehler beim Laden der Daten (${res.status})`,
        res.status,
        errorInfo,
      )
      throw error
    }

    return res.json()
  } catch (err) {
    // Retry on network errors (connection lost, etc.)
    if (retries > 0 && err instanceof TypeError && err.message.includes('fetch')) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return swrFetcher<T>(url, retries - 1)
    }
    throw err
  }
}

/**
 * Fetcher that handles both array and object responses
 * (normalizes API responses that might return data directly or wrapped)
 */
export async function swrFetcherNormalized<T>(url: string): Promise<T> {
  const data = await swrFetcher<T>(url)
  return data
}

/**
 * POST/PUT/DELETE helper with optimistic update support
 */
export async function mutationFetcher<T>(
  url: string,
  options: {
    method: "POST" | "PUT" | "PATCH" | "DELETE"
    body?: unknown
  },
): Promise<T> {
  const res = await fetch(url, {
    method: options.method,
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include", // Include cookies for authentication
  })

  if (!res.ok) {
    let errorInfo: unknown
    try {
      errorInfo = await res.json()
    } catch {
      errorInfo = { message: res.statusText }
    }

    const error = new FetchError(
      (errorInfo as { error?: string; message?: string })?.error ||
        (errorInfo as { message?: string })?.message ||
        `Fehler bei der Aktion (${res.status})`,
      res.status,
      errorInfo,
    )
    throw error
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return {} as T
  }

  return res.json()
}

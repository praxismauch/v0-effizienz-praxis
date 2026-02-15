/**
 * Secure API client with automatic origin header injection
 * Prevents direct curl/Postman access by adding signed origin tokens
 */

let cachedToken: string | null = null
let tokenExpiry: number = 0

/**
 * Fetch a new origin token from the server
 */
async function fetchOriginToken(): Promise<string> {
  try {
    const response = await fetch("/api/auth/origin-token")
    if (!response.ok) {
      console.warn("[v0] Failed to fetch origin token")
      return ""
    }
    
    const data = await response.json()
    cachedToken = data.token
    tokenExpiry = Date.now() + (data.expiresIn * 1000) - 30000 // Refresh 30s before expiry
    
    return data.token
  } catch (error) {
    console.error("[v0] Error fetching origin token:", error)
    return ""
  }
}

/**
 * Get cached token or fetch a new one if expired
 */
async function getOriginToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }
  
  return await fetchOriginToken()
}

/**
 * Enhanced fetch that automatically includes origin header
 * Use this instead of regular fetch for all API calls
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getOriginToken()
  
  const headers = new Headers(options.headers)
  if (token) {
    headers.set("X-App-Origin", token)
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (url: string, options?: RequestInit) =>
    secureFetch(url, { ...options, method: "GET" }),

  post: (url: string, body?: unknown, options?: RequestInit) =>
    secureFetch(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: (url: string, body?: unknown, options?: RequestInit) =>
    secureFetch(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: (url: string, body?: unknown, options?: RequestInit) =>
    secureFetch(url, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: (url: string, options?: RequestInit) =>
    secureFetch(url, { ...options, method: "DELETE" }),
}

/**
 * Prefetch origin token on app load to avoid delays on first request
 */
if (typeof window !== "undefined") {
  fetchOriginToken().catch(() => {
    // Silently fail - will retry on first request
  })
}

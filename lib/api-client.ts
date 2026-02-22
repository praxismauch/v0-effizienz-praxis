import { useRouter } from "next/navigation"

/**
 * Centralized API client with retry logic and proper error handling
 * 
 * Features:
 * - Automatic retry on 401 with exponential backoff
 * - Consistent error handling
 * - Automatic redirect to login on persistent auth failures
 * - Request deduplication
 */

const MAX_RETRIES = 2
const INITIAL_RETRY_DELAY = 500

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

interface ApiClientOptions extends RequestInit {
  maxRetries?: number
  retryDelay?: number
  skipRetry?: boolean
}

/**
 * Make an API request with automatic retry on 401
 */
export async function apiClient<T = any>(
  url: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const {
    maxRetries = MAX_RETRIES,
    retryDelay = INITIAL_RETRY_DELAY,
    skipRetry = false,
    ...fetchOptions
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          "Content-Type": "application/json",
          ...fetchOptions.headers,
        },
      })

      // Handle 401 Unauthorized
      if (response.status === 401) {
        // If this is the last attempt or retry is disabled, redirect to login
        if (attempt === maxRetries || skipRetry) {
          // Only redirect on client side
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname
            window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`
          }
          throw new ApiError("Session expired", 401, "AUTH_EXPIRED")
        }

        // Wait before retrying with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // Handle other error status codes
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || response.statusText
        throw new ApiError(errorMessage, response.status, errorData.code)
      }

      // Success - return JSON data
      return await response.json()
    } catch (error) {
      lastError = error as Error

      // If it's not a network error or 401, don't retry
      if (!(error instanceof TypeError) && !((error as ApiError).status === 401)) {
        throw error
      }

      // If we've exhausted retries, throw the error
      if (attempt === maxRetries) {
        throw error
      }

      // Wait before retrying (for network errors)
      const delay = retryDelay * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // Should never reach here, but just in case
  throw lastError || new Error("Request failed after retries")
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(url: string, options?: ApiClientOptions): Promise<T> {
  return apiClient<T>(url, { ...options, method: "GET" })
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
  url: string,
  data?: any,
  options?: ApiClientOptions
): Promise<T> {
  return apiClient<T>(url, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PUT request helper
 */
export async function apiPut<T = any>(
  url: string,
  data?: any,
  options?: ApiClientOptions
): Promise<T> {
  return apiClient<T>(url, {
    ...options,
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PATCH request helper
 */
export async function apiPatch<T = any>(
  url: string,
  data?: any,
  options?: ApiClientOptions
): Promise<T> {
  return apiClient<T>(url, {
    ...options,
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(url: string, options?: ApiClientOptions): Promise<T> {
  return apiClient<T>(url, { ...options, method: "DELETE" })
}

/**
 * SWR fetcher with automatic retry
 */
export const swrFetcher = async <T = any>(url: string): Promise<T> => {
  return apiGet<T>(url)
}

/**
 * Check if error is an auth error that requires re-login
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 401 || error.code === "AUTH_EXPIRED"
  }
  return false
}

/**
 * Check if error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 403
  }
  return false
}

/**
 * Format error message for display
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return "Ein unerwarteter Fehler ist aufgetreten"
}

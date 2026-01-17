"use client"

import { SWRConfig } from "swr"
import type { ReactNode } from "react"
import { dequal } from "dequal"

// Auth errors will stop retrying but won't pause ALL requests globally

function isAuthError(error: any): boolean {
  if (!error) return false

  // Only 401 (Unauthorized) and 403 (Forbidden) are auth errors
  // 404 is NOT an auth error - it means route/resource doesn't exist
  if (error.status === 401 || error.status === 403) return true

  // Check for auth-related error messages
  const message = error.message?.toLowerCase() || ""
  return (
    message.includes("unauthorized") ||
    message.includes("not authenticated") ||
    message.includes("session expired") ||
    message.includes("jwt expired") ||
    message.includes("invalid token")
  )
}

const fetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) {
    const error: any = new Error("An error occurred while fetching the data.")
    error.status = res.status

    try {
      const errorData = await res.json()
      error.message = errorData.error || errorData.message || error.message
    } catch {
      // If response isn't JSON, use default message
    }

    throw error
  }

  return res.json()
}

export function SWRProvider({ children }: { children: ReactNode }) {
  // This prevents the global deadlock where one auth failure stops everything

  const swrConfig = {
    dedupingInterval: 2000,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    keepPreviousData: true,
    errorRetryCount: 3,
    errorRetryInterval: 1000,

    // This stabilizes SWR globally - if API returns same data with new reference,
    // SWR won't trigger a re-render
    compare: (a: any, b: any) => dequal(a, b),

    shouldRetryOnError: (error: any) => {
      const status = error?.status

      // List of all status codes that should NOT retry
      const noRetryStatuses = [
        400, // Bad Request - malformed query, won't fix itself
        401, // Unauthorized - need to re-authenticate
        403, // Forbidden - permission denied
        404, // Not Found - resource doesn't exist
        405, // Method Not Allowed
        409, // Conflict
        410, // Gone
        422, // Unprocessable Entity - validation error
        429, // Too Many Requests - rate limited (could retry with backoff, but safer to stop)
        500, // Internal Server Error
        501, // Not Implemented
        502, // Bad Gateway
        503, // Service Unavailable
        504, // Gateway Timeout
      ]

      if (noRetryStatuses.includes(status)) {
        console.warn(`[v0] SWR: HTTP ${status} error, stopping retries`)
        return false
      }

      // Only retry on network errors or unknown errors
      return true
    },

    onError: (error: any, key: string) => {
      console.error("[v0] SWR Error:", {
        key,
        status: error.status,
        message: error.message,
      })
    },

    fetcher,
  }

  return <SWRConfig value={swrConfig}>{children}</SWRConfig>
}

export default SWRProvider

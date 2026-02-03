"use client"

import { SWRConfig } from "swr"
import type { ReactNode } from "react"
import { dequal } from "dequal"
import Logger from "@/lib/logger"

/**
 * Check if an error is an authentication error
 * Auth errors stop retrying but don't pause ALL requests globally
 */
export function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false

  const err = error as { status?: number; message?: string }

  // Only 401 (Unauthorized) and 403 (Forbidden) are auth errors
  // 404 is NOT an auth error - it means route/resource doesn't exist
  if (err.status === 401 || err.status === 403) return true

  // Check for auth-related error messages
  const message = err.message?.toLowerCase() || ""
  return (
    message.includes("unauthorized") ||
    message.includes("not authenticated") ||
    message.includes("session expired") ||
    message.includes("jwt expired") ||
    message.includes("invalid token") ||
    message.includes("nicht authentifiziert")
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

/**
 * Shared SWR configuration for hooks that need custom settings
 * Use this instead of defining local SWR_CONFIG in each hook
 */
export const SHARED_SWR_CONFIG = {
  revalidateOnFocus: false,
  dedupingInterval: 2000,
  errorRetryCount: 2,
  errorRetryInterval: 1000,
} as const

/**
 * SWR configuration for real-time data that needs periodic refresh
 */
export const REALTIME_SWR_CONFIG = {
  ...SHARED_SWR_CONFIG,
  refreshInterval: 30000, // 30 seconds
  revalidateOnReconnect: true,
} as const

export function SWRProvider({ children }: { children: ReactNode }) {
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
        return false
      }

      // Only retry on network errors or unknown errors
      return true
    },

    onError: (error: unknown, key: string) => {
      const err = error as { status?: number; message?: string }
      
      // Don't log auth errors at error level - they're expected on logout/session expiry
      if (isAuthError(error)) {
        Logger.debug("swr", "Auth error (expected)", { key, status: err.status })
        return
      }
      
      Logger.error("swr", "SWR fetch error", error, { key, status: err.status })
    },

    fetcher,
  }

  return <SWRConfig value={swrConfig}>{children}</SWRConfig>
}

export default SWRProvider

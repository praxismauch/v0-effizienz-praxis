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

    // isPaused: () => isAuthFailed,  // DO NOT USE THIS

    shouldRetryOnError: (error: any) => {
      // Don't retry auth errors
      if (isAuthError(error)) {
        console.warn("[v0] SWR: Auth error detected, stopping retries for this request")
        return false
      }

      // Don't retry 500 errors
      if (error.status === 500) {
        return false
      }

      // Don't retry 404 errors (resource not found)
      if (error.status === 404) {
        return false
      }

      return true
    },

    onError: (error: any, key: string) => {
      // Just log errors, don't pause anything globally
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

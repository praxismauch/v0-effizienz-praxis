"use client"

import { SWRConfig } from "swr"
import type { ReactNode } from "react"

function isAuthError(error: any): boolean {
  if (!error) return false

  // Check for 401/403 status codes
  if (error.status === 401 || error.status === 403) return true

  // Check for auth-related error messages
  const message = error.message?.toLowerCase() || ""
  return (
    message.includes("unauthorized") || message.includes("not authenticated") || message.includes("session expired")
  )
}

const fetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) {
    const error: any = new Error("An error occurred while fetching the data.")
    error.status = res.status

    // Try to parse error body for more details
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

const swrConfig = {
  // Dedupe requests within 2 seconds
  dedupingInterval: 2000,
  // Focus revalidation disabled to reduce API calls
  revalidateOnFocus: false,
  // Revalidate on reconnect
  revalidateOnReconnect: true,
  // Keep previous data while revalidating
  keepPreviousData: true,
  // Retry failed requests
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  shouldRetryOnError: (error: any) => {
    // Don't retry auth errors (user needs to log in again)
    if (isAuthError(error)) {
      console.warn("[v0] SWR: Auth error detected, stopping retries")
      return false
    }

    // Don't retry 500 errors indefinitely (likely server issue)
    if (error.status === 500) {
      console.warn("[v0] SWR: Server error detected, stopping retries")
      return false
    }

    // Don't retry 404 errors (resource doesn't exist)
    if (error.status === 404) {
      return false
    }

    // Retry other errors (network issues, timeouts, etc.)
    return true
  },
  onError: (error: any, key: string) => {
    console.error("[v0] SWR Error:", {
      key,
      status: error.status,
      message: error.message,
    })

    // If auth error, could trigger logout or session refresh here
    if (isAuthError(error)) {
      console.warn("[v0] SWR: Authentication failed. User may need to re-login.")
      // Optional: trigger logout
      // window.location.href = '/login'
    }
  },
  // Custom fetcher with better error handling
  fetcher,
}

export function SWRProvider({ children }: { children: ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>
}

export default SWRProvider

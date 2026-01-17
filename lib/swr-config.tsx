"use client"

import { SWRConfig, useSWRConfig } from "swr"
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

interface AuthStateContextType {
  isAuthFailed: boolean
  setAuthFailed: (failed: boolean) => void
  resetAuth: () => void
}

const AuthStateContext = createContext<AuthStateContextType>({
  isAuthFailed: false,
  setAuthFailed: () => {},
  resetAuth: () => {},
})

export function useAuthState() {
  return useContext(AuthStateContext)
}

function isAuthError(error: any): boolean {
  if (!error) return false

  // Check for 401/403 status codes
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

export function SWRProvider({ children }: { children: ReactNode }) {
  const [isAuthFailed, setIsAuthFailed] = useState(false)

  const setAuthFailed = useCallback((failed: boolean) => {
    setIsAuthFailed(failed)
    if (failed) {
      console.warn("[v0] SWR: Global auth failure detected - pausing all requests")
    }
  }, [])

  const resetAuth = useCallback(() => {
    console.log("[v0] SWR: Auth recovered - resuming requests")
    setIsAuthFailed(false)
  }, [])

  // Listen for successful auth to auto-recover
  useEffect(() => {
    const handleAuthRecovery = () => {
      if (isAuthFailed) {
        resetAuth()
      }
    }

    // Custom event for auth recovery (triggered by user-context on successful login/refresh)
    window.addEventListener("auth-recovered", handleAuthRecovery)
    return () => window.removeEventListener("auth-recovered", handleAuthRecovery)
  }, [isAuthFailed, resetAuth])

  const swrConfig = {
    dedupingInterval: 2000,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    keepPreviousData: true,
    errorRetryCount: 3,
    errorRetryInterval: 1000,

    isPaused: () => isAuthFailed,

    shouldRetryOnError: (error: any) => {
      // Don't retry auth errors
      if (isAuthError(error)) {
        console.warn("[v0] SWR: Auth error detected, stopping retries")
        return false
      }

      // Don't retry 500 errors indefinitely
      if (error.status === 500) {
        console.warn("[v0] SWR: Server error detected, stopping retries")
        return false
      }

      // Don't retry 404 errors
      if (error.status === 404) {
        return false
      }

      // Retry other errors
      return true
    },

    onError: (error: any, key: string) => {
      console.error("[v0] SWR Error:", {
        key,
        status: error.status,
        message: error.message,
      })

      if (isAuthError(error)) {
        console.warn("[v0] SWR: Authentication failed globally. Pausing all SWR requests.")
        setAuthFailed(true)
      }
    },

    fetcher,
  }

  return (
    <AuthStateContext.Provider value={{ isAuthFailed, setAuthFailed, resetAuth }}>
      <SWRConfig value={swrConfig}>{children}</SWRConfig>
    </AuthStateContext.Provider>
  )
}

export function useSWRAuthRecovery() {
  const { isAuthFailed, resetAuth } = useAuthState()
  const { mutate } = useSWRConfig()

  const recoverAndRefetch = useCallback(async () => {
    resetAuth()
    // Revalidate all SWR caches after auth recovery
    await mutate(() => true, undefined, { revalidate: true })
  }, [resetAuth, mutate])

  return { isAuthFailed, recoverAndRefetch }
}

export default SWRProvider

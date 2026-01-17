"use client"

import { SWRConfig, useSWRConfig } from "swr"
import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react"

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
  const [isAuthFailed, setIsAuthFailed] = useState(false)
  const authErrorCount = useRef(0)
  const AUTH_ERROR_THRESHOLD = 3 // Only pause after 3 consecutive auth errors

  const setAuthFailed = useCallback((failed: boolean) => {
    setIsAuthFailed(failed)
    if (failed) {
      console.warn("[v0] SWR: Global auth failure detected - pausing all requests")
    }
  }, [])

  const resetAuth = useCallback(() => {
    console.log("[v0] SWR: Auth recovered - resuming requests")
    setIsAuthFailed(false)
    authErrorCount.current = 0
  }, [])

  // Listen for successful auth to auto-recover
  useEffect(() => {
    const handleAuthRecovery = () => {
      if (isAuthFailed) {
        resetAuth()
      }
    }

    window.addEventListener("auth-recovered", handleAuthRecovery)
    return () => window.removeEventListener("auth-recovered", handleAuthRecovery)
  }, [isAuthFailed, resetAuth])

  useEffect(() => {
    const handleSuccess = () => {
      if (authErrorCount.current > 0) {
        authErrorCount.current = 0
      }
    }

    window.addEventListener("swr-fetch-success", handleSuccess)
    return () => window.removeEventListener("swr-fetch-success", handleSuccess)
  }, [])

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
        return false
      }

      // Don't retry 500 errors
      if (error.status === 500) {
        return false
      }

      // Don't retry 404 errors (resource not found, not auth related)
      if (error.status === 404) {
        return false
      }

      return true
    },

    onSuccess: () => {
      if (authErrorCount.current > 0) {
        authErrorCount.current = 0
      }
      // Dispatch success event
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("swr-fetch-success"))
      }
    },

    onError: (error: any, key: string) => {
      console.error("[v0] SWR Error:", {
        key,
        status: error.status,
        message: error.message,
      })

      if (isAuthError(error)) {
        authErrorCount.current++
        console.warn(`[v0] SWR: Auth error ${authErrorCount.current}/${AUTH_ERROR_THRESHOLD}`)

        // Only pause after threshold reached to avoid false positives
        if (authErrorCount.current >= AUTH_ERROR_THRESHOLD) {
          console.warn("[v0] SWR: Multiple auth failures - pausing all requests")
          setAuthFailed(true)
        }
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
    await mutate(() => true, undefined, { revalidate: true })
  }, [resetAuth, mutate])

  return { isAuthFailed, recoverAndRefetch }
}

export default SWRProvider

"use client"

import { useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Logger from "@/lib/logger"

interface UseSessionHeartbeatOptions {
  /** Interval in milliseconds between heartbeats (default: 5 minutes) */
  interval?: number
  /** Whether heartbeat is enabled (default: true) */
  enabled?: boolean
  /** Callback when session is refreshed successfully */
  onRefresh?: () => void
  /** Callback when session refresh fails */
  onError?: (error: Error) => void
}

const DEFAULT_INTERVAL = 5 * 60 * 1000 // 5 minutes

/**
 * Hook that keeps the Supabase session alive by periodically refreshing the token.
 * Also handles tab visibility - pauses when hidden, refreshes immediately when visible.
 */
export function useSessionHeartbeat(options: UseSessionHeartbeatOptions = {}) {
  const { interval = DEFAULT_INTERVAL, enabled = true, onRefresh, onError } = options

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastRefreshRef = useRef<number>(Date.now())
  const isRefreshingRef = useRef(false)

  const refreshSession = useCallback(
    async (reason: string) => {
      // Prevent concurrent refreshes
      if (isRefreshingRef.current) {
        Logger.debug("heartbeat", "Skipping refresh - already in progress")
        return
      }

      // Skip if we're in dev mode with auto-login
      if (process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true" && process.env.NODE_ENV !== "production") {
        return
      }

      isRefreshingRef.current = true

      try {
        const supabase = createClient()

        // First check if we have a session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw new Error(`Session check failed: ${sessionError.message}`)
        }

        if (!session) {
          Logger.debug("heartbeat", "No active session, skipping refresh")
          isRefreshingRef.current = false
          return
        }

        // Refresh the session
        const { data, error } = await supabase.auth.refreshSession()

        if (error) {
          throw new Error(`Token refresh failed: ${error.message}`)
        }

        if (data.session) {
          lastRefreshRef.current = Date.now()
          Logger.debug("heartbeat", `Session refreshed successfully (${reason})`, {
            expiresAt: data.session.expires_at,
          })
          onRefresh?.()
        }
      } catch (error) {
        Logger.error("heartbeat", `Session refresh failed (${reason})`, error)
        onError?.(error instanceof Error ? error : new Error(String(error)))
      } finally {
        isRefreshingRef.current = false
      }
    },
    [onRefresh, onError],
  )

  // Handle tab visibility changes
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Tab became visible - check if we need to refresh
        const timeSinceLastRefresh = Date.now() - lastRefreshRef.current

        // If more than 1 minute has passed since last refresh, do it now
        if (timeSinceLastRefresh > 60 * 1000) {
          Logger.debug("heartbeat", "Tab visible, refreshing session", {
            timeSinceLastRefresh: Math.round(timeSinceLastRefresh / 1000) + "s",
          })
          refreshSession("tab-visible")
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [enabled, refreshSession])

  // Handle online/offline status
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    const handleOnline = () => {
      Logger.debug("heartbeat", "Network online, refreshing session")
      refreshSession("network-online")
    }

    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("online", handleOnline)
    }
  }, [enabled, refreshSession])

  // Set up the interval
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    // Initial refresh after a short delay
    const initialTimeout = setTimeout(() => {
      refreshSession("initial")
    }, 5000) // 5 seconds after mount

    // Set up periodic refresh
    intervalRef.current = setInterval(() => {
      // Only refresh if tab is visible
      if (document.visibilityState === "visible") {
        refreshSession("interval")
      }
    }, interval)

    return () => {
      clearTimeout(initialTimeout)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, interval, refreshSession])

  // Return a manual refresh function
  return {
    refreshSession: () => refreshSession("manual"),
    lastRefresh: lastRefreshRef.current,
  }
}

export default useSessionHeartbeat

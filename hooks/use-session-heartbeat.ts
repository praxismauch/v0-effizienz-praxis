"use client"

import { useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Logger from "@/lib/logger"

interface UseSessionHeartbeatOptions {
  /** Interval in milliseconds between heartbeats (default: 5 minutes) */
  interval?: number
  /** Whether heartbeat is enabled (default: true) */
  enabled?: boolean
  /** Idle timeout in milliseconds (default: 30 minutes, 0 to disable) */
  idleTimeout?: number
  /** Callback when session is refreshed successfully */
  onRefresh?: () => void
  /** Callback when session refresh fails */
  onError?: (error: Error) => void
  /** Callback when user becomes idle and is logged out */
  onIdle?: () => void
}

const DEFAULT_INTERVAL = 5 * 60 * 1000 // 5 minutes
const DEFAULT_IDLE_TIMEOUT = 30 * 60 * 1000 // 30 minutes

/**
 * Hook that keeps the Supabase session alive by periodically refreshing the token.
 * Also handles tab visibility - pauses when hidden, refreshes immediately when visible.
 */
export function useSessionHeartbeat(options: UseSessionHeartbeatOptions = {}) {
  const {
    interval = DEFAULT_INTERVAL,
    enabled = true,
    idleTimeout = DEFAULT_IDLE_TIMEOUT,
    onRefresh,
    onError,
    onIdle,
  } = options

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastRefreshRef = useRef<number>(Date.now())
  const lastActivityRef = useRef<number>(Date.now())
  const isRefreshingRef = useRef(false)

  const handleIdleTimeout = useCallback(async () => {
    Logger.warn("heartbeat", "User idle timeout - logging out")

    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      onIdle?.()
    } catch (error) {
      Logger.error("heartbeat", "Error during idle logout", error)
    }
  }, [onIdle])

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now()

    // Clear existing timeout
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current)
    }

    // Set new timeout if idle detection is enabled
    if (idleTimeout > 0) {
      idleTimeoutRef.current = setTimeout(handleIdleTimeout, idleTimeout)
    }
  }, [idleTimeout, handleIdleTimeout])

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

  // Track user activity for idle detection
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || idleTimeout === 0) return

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"]

    events.forEach((event) => {
      window.addEventListener(event, resetIdleTimer, { passive: true })
    })

    // Initialize idle timer
    resetIdleTimer()

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer)
      })
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current)
      }
    }
  }, [enabled, idleTimeout, resetIdleTimer])

  // Handle tab visibility changes
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Reset idle timer when tab becomes visible
        resetIdleTimer()

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
  }, [enabled, refreshSession, resetIdleTimer])

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

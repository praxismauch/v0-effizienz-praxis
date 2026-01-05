/**
 * Performance Optimization: React hook for cached data fetching
 * - Automatic caching
 * - Background revalidation
 * - Request deduplication
 * - Optimistic updates
 */

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { deduplicatedFetch } from "@/lib/performance/api-cache"

interface UseCachedFetchOptions<T> {
  initialData?: T
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  dedupingInterval?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseCachedFetchResult<T> {
  data: T | undefined
  error: Error | null
  isLoading: boolean
  isValidating: boolean
  mutate: (data?: T | ((current: T | undefined) => T)) => void
  refresh: () => Promise<void>
}

// Client-side cache
const clientCache = new Map<string, { data: any; timestamp: number }>()
const CLIENT_CACHE_TTL = 30000 // 30 seconds

export function useCachedFetch<T>(url: string | null, options: UseCachedFetchOptions<T> = {}): UseCachedFetchResult<T> {
  const {
    initialData,
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    dedupingInterval = 2000,
    onSuccess,
    onError,
  } = options

  const [data, setData] = useState<T | undefined>(initialData)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(!initialData && !!url)
  const [isValidating, setIsValidating] = useState(false)
  const lastFetchRef = useRef<number>(0)
  const mountedRef = useRef(true)

  const fetchData = useCallback(
    async (showLoading = true) => {
      if (!url) return

      const now = Date.now()

      // Check deduping interval
      if (now - lastFetchRef.current < dedupingInterval) {
        return
      }
      lastFetchRef.current = now

      // Check client cache first
      const cached = clientCache.get(url)
      if (cached && now - cached.timestamp < CLIENT_CACHE_TTL) {
        if (mountedRef.current) {
          setData(cached.data)
          setIsLoading(false)
        }
        // Still revalidate in background
        setIsValidating(true)
      } else if (showLoading) {
        setIsLoading(true)
      }

      try {
        const result = await deduplicatedFetch<T>(url)

        // Update client cache
        clientCache.set(url, { data: result, timestamp: now })

        if (mountedRef.current) {
          setData(result)
          setError(null)
          onSuccess?.(result)
        }
      } catch (err) {
        if (mountedRef.current) {
          const error = err instanceof Error ? err : new Error(String(err))
          setError(error)
          onError?.(error)
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false)
          setIsValidating(false)
        }
      }
    },
    [url, dedupingInterval, onSuccess, onError],
  )

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true
    fetchData()
    return () => {
      mountedRef.current = false
    }
  }, [fetchData])

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus) return

    const handleFocus = () => {
      fetchData(false) // Don't show loading on focus revalidation
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [revalidateOnFocus, fetchData])

  // Revalidate on reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) return

    const handleOnline = () => {
      fetchData(false)
    }

    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [revalidateOnReconnect, fetchData])

  const mutate = useCallback(
    (newData?: T | ((current: T | undefined) => T)) => {
      if (typeof newData === "function") {
        setData((current) => (newData as (current: T | undefined) => T)(current))
      } else if (newData !== undefined) {
        setData(newData)
      }
      // Invalidate cache
      if (url) {
        clientCache.delete(url)
      }
    },
    [url],
  )

  const refresh = useCallback(async () => {
    if (url) {
      clientCache.delete(url)
    }
    lastFetchRef.current = 0
    await fetchData()
  }, [url, fetchData])

  return { data, error, isLoading, isValidating, mutate, refresh }
}

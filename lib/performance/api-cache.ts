// In-memory cache for client-side deduplication
const requestCache = new Map<string, { promise: Promise<any>; timestamp: number }>()
const DEDUP_WINDOW = 2000 // 2 seconds

// Cache TTLs for different endpoints (in seconds)
export const API_CACHE_TTL: Record<string, number> = {
  "/api/practices/*/sidebar-badges": 300,
  "/api/practices/*/goals": 60,
  "/api/practices/*/team-members": 120,
  "/api/practices/*/dashboard-stats": 60,
  "/api/practices/*/calendar/events": 30,
  "/api/practices/*/todos": 30,
  "/api/notifications": 60,
  "/api/tickets/stats": 300,
}

// Check if URL matches pattern
function matchesPattern(url: string, pattern: string): boolean {
  const regex = new RegExp("^" + pattern.replace(/\*/g, "[^/]+") + "$")
  return regex.test(url)
}

// Get cache TTL for URL
export function getCacheTTL(url: string): number {
  for (const [pattern, ttl] of Object.entries(API_CACHE_TTL)) {
    if (matchesPattern(url, pattern)) {
      return ttl
    }
  }
  return 0 // No caching by default
}

// Deduplicated fetch - prevents multiple identical requests within a short window
export async function deduplicatedFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const cacheKey = `${options?.method || "GET"}:${url}`
  const now = Date.now()

  // Check for in-flight request
  const cached = requestCache.get(cacheKey)
  if (cached && now - cached.timestamp < DEDUP_WINDOW) {
    return cached.promise
  }

  // Create new request
  const promise = fetch(url, options).then(async (res) => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    return res.json()
  })

  // Store in cache
  requestCache.set(cacheKey, { promise, timestamp: now })

  // Clean up after resolution
  promise.finally(() => {
    setTimeout(() => {
      const current = requestCache.get(cacheKey)
      if (current && current.timestamp === now) {
        requestCache.delete(cacheKey)
      }
    }, DEDUP_WINDOW)
  })

  return promise
}

// Batch multiple fetches with automatic parallelization
export async function batchFetch<T extends Record<string, string>>(urls: T): Promise<{ [K in keyof T]: any }> {
  const entries = Object.entries(urls)
  const results = await Promise.all(
    entries.map(async ([key, url]) => {
      try {
        const data = await deduplicatedFetch(url)
        return [key, data]
      } catch (error) {
        console.warn(`[v0] Batch fetch failed for ${key}:`, error)
        return [key, null]
      }
    }),
  )
  return Object.fromEntries(results)
}

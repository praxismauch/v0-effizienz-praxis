/**
 * Redis cache layer for effizienz-praxis.de using Upstash
 * DSGVO-compliant: No PII in Redis keys
 */

import { Redis } from "@upstash/redis"

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis

  try {
    const url = typeof process !== "undefined" && process.env ? process.env.KV_REST_API_URL : undefined
    const token = typeof process !== "undefined" && process.env ? process.env.KV_REST_API_TOKEN : undefined

    if (!url || !token) {
      console.warn("[v0] Redis not configured - KV_REST_API_URL or KV_REST_API_TOKEN missing")
      return null
    }

    redis = new Redis({ url, token })
    return redis
  } catch (error) {
    console.warn("[v0] Failed to initialize Redis:", error)
    return null
  }
}

// Cache key generators (DSGVO-compliant - no PII)
export const cacheKeys = {
  notifications: (userId: string) => `n:${userId}`,
  sidebarBadges: (practiceId: string) => `sb:${practiceId}`,
  ticketStats: (practiceId: string) => `ts:${practiceId}`,
  practiceData: (practiceId: string) => `pd:${practiceId}`,
}

// Cache TTLs (in seconds)
export const cacheTTL = {
  notifications: 60, // 1 minute
  sidebarBadges: 300, // 5 minutes
  ticketStats: 300, // 5 minutes
  practiceData: 600, // 10 minutes
}

function isRedisRateLimitError(error: any): boolean {
  if (!error) return false
  const message = error.message || String(error)
  return (
    message.includes("Too Many") ||
    message.includes("rate limit") ||
    message.includes("t.map is not a function") ||
    message.includes("429")
  )
}

// Helper: Safe Redis get with JSON parsing
export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedis()
  if (!client) return null

  try {
    const cached = await client.get<string>(key)
    if (!cached) return null

    if (typeof cached === "string") {
      try {
        const parsed = JSON.parse(cached)
        if (parsed === null || parsed === undefined) {
          return null
        }
        return parsed as T
      } catch (parseError) {
        await invalidateCache(key).catch(() => {})
        return null
      }
    }

    // Already parsed (Upstash auto-parses sometimes)
    if (cached && typeof cached === "object") {
      return cached as T
    }

    await invalidateCache(key).catch(() => {})
    return null
  } catch (error: any) {
    if (!isRedisRateLimitError(error)) {
      console.warn(`[v0] Redis get failed for key ${key}:`, error?.message || error)
    }
    return null
  }
}

// Helper: Safe Redis set with JSON stringification
export async function setCached<T>(key: string, value: T, ttl: number): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    if (value === undefined || value === null) {
      return
    }

    let stringValue: string
    try {
      stringValue = JSON.stringify(value)
      if (!stringValue || stringValue === "undefined" || stringValue === "null") {
        return
      }
    } catch (stringifyError) {
      return
    }

    await client.setex(key, ttl, stringValue)
  } catch (error: any) {
    if (!isRedisRateLimitError(error)) {
      console.warn(`[v0] Redis set failed for key ${key}:`, error?.message || error)
    }
  }
}

// Helper: Invalidate cache
export async function invalidateCache(key: string): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    await client.del(key)
  } catch (error: any) {
    if (!isRedisRateLimitError(error)) {
      console.warn(`[v0] Redis del failed for key ${key}:`, error)
    }
  }
}

// Helper: Batch invalidate
export async function invalidateCacheBatch(keys: string[]): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    if (keys.length === 0) return
    await client.del(...keys)
  } catch (error: any) {
    if (!isRedisRateLimitError(error)) {
      console.warn(`[v0] Redis batch del failed:`, error)
    }
  }
}

export { getRedis as redis }

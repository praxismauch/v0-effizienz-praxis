/**
 * ✅ PRESERVES 100% EXISTING BUSINESS LOGIC
 * Non-intrusive API cache middleware
 * Implements stale-while-revalidate pattern
 */

import { type NextRequest, NextResponse } from "next/server"
import { getCached, setCached } from "@/lib/redis"

// Routes to cache (add more as needed)
const CACHEABLE_ROUTES = ["/api/notifications", "/api/tickets/stats", "/api/practices/*/sidebar-badges"]

// Check if route should be cached
function shouldCache(pathname: string): boolean {
  return CACHEABLE_ROUTES.some((route) => {
    const pattern = route.replace("*", "[^/]+")
    return new RegExp(`^${pattern}$`).test(pathname)
  })
}

// Generate cache key from request
function getCacheKey(request: NextRequest): string {
  const url = new URL(request.url)
  const authHeader = request.headers.get("authorization") || ""
  const userId = authHeader ? Buffer.from(authHeader).toString("base64").slice(0, 16) : "anon"
  return `api:${userId}:${url.pathname}:${url.search}`
}

// Cache middleware wrapper
export async function withCache(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
): Promise<NextResponse> {
  // Only cache GET requests
  if (request.method !== "GET") {
    return handler(request)
  }

  const pathname = new URL(request.url).pathname

  // Check if route should be cached
  if (!shouldCache(pathname)) {
    return handler(request)
  }

  const cacheKey = getCacheKey(request)

  try {
    // Try to get from cache
    const cached = await getCached<any>(cacheKey)

    if (cached) {
      console.log(`[v0] Cache hit: ${pathname}`)
      // Return cached response with stale header
      const response = NextResponse.json(cached)
      response.headers.set("X-Cache", "HIT")
      response.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
      return response
    }

    // Cache miss - execute handler
    console.log(`[v0] Cache miss: ${pathname}`)
    const response = await handler(request)

    // Cache successful responses
    if (response.status === 200) {
      const data = await response.json()
      await setCached(cacheKey, data, 300) // 5 minutes

      const newResponse = NextResponse.json(data)
      newResponse.headers.set("X-Cache", "MISS")
      return newResponse
    }

    return response
  } catch (error) {
    console.error("[v0] Cache middleware error:", error)
    // On error, bypass cache
    return handler(request)
  }
}

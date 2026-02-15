/**
 * Centralized cache configuration for API endpoints
 * 
 * This file defines cache strategies for different types of data:
 * - Static data: Long TTL, rarely changes (practices, settings)
 * - User data: Medium TTL, changes moderately (user profiles, team members)
 * - Dynamic data: Short TTL or no cache, changes frequently (todos, workflows)
 */

export const CACHE_STRATEGIES = {
  // Static data - cache for 1 hour
  PRACTICES: {
    ttl: 3600, // 1 hour
    staleWhileRevalidate: 7200, // 2 hours
    tags: ['practices'],
  },
  
  // Settings data - cache for 30 minutes
  SETTINGS: {
    ttl: 1800, // 30 minutes
    staleWhileRevalidate: 3600, // 1 hour
    tags: ['settings'],
  },
  
  // User data - cache for 5 minutes
  USERS: {
    ttl: 300, // 5 minutes
    staleWhileRevalidate: 600, // 10 minutes
    tags: ['users'],
  },
  
  // Team data - cache for 5 minutes
  TEAMS: {
    ttl: 300, // 5 minutes
    staleWhileRevalidate: 600, // 10 minutes
    tags: ['teams'],
  },
  
  // Analytics - cache for 10 minutes
  ANALYTICS: {
    ttl: 600, // 10 minutes
    staleWhileRevalidate: 1200, // 20 minutes
    tags: ['analytics'],
  },
  
  // Todos - no cache (real-time data)
  TODOS: {
    ttl: 0,
    staleWhileRevalidate: 30,
    tags: ['todos'],
  },
} as const

/**
 * Generate cache headers for Next.js responses
 */
export function getCacheHeaders(strategy: keyof typeof CACHE_STRATEGIES) {
  const config = CACHE_STRATEGIES[strategy]
  
  if (config.ttl === 0) {
    return {
      'Cache-Control': 'no-store, must-revalidate',
    }
  }
  
  return {
    'Cache-Control': `public, s-maxage=${config.ttl}, stale-while-revalidate=${config.staleWhileRevalidate}`,
  }
}

/**
 * Generate cache key for SWR
 */
export function getCacheKey(endpoint: string, params?: Record<string, any>): string {
  if (!params) return endpoint
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
    
  return `${endpoint}?${sortedParams}`
}

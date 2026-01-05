// Simple in-memory request cache for deduplication
type CacheEntry = {
  data: any
  timestamp: number
  promise?: Promise<any>
}

const cache = new Map<string, CacheEntry>()
const DEFAULT_TTL = 30000 // 30 seconds

export function getCachedOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttl: number = DEFAULT_TTL): Promise<T> {
  const now = Date.now()
  const cached = cache.get(key)

  // Return cached data if still valid
  if (cached && now - cached.timestamp < ttl) {
    if (cached.promise) {
      return cached.promise
    }
    return Promise.resolve(cached.data)
  }

  // Deduplicate in-flight requests
  const promise = fetchFn()
    .then((data) => {
      cache.set(key, { data, timestamp: Date.now() })
      return data
    })
    .catch((error) => {
      cache.delete(key)
      throw error
    })

  cache.set(key, { data: null, timestamp: now, promise })
  return promise
}

export function invalidateCache(key: string) {
  cache.delete(key)
}

export function clearCache() {
  cache.clear()
}

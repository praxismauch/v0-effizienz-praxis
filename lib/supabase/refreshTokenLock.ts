/**
 * Stores pending refresh operations
 * Key: refresh token or request ID
 * Value: Promise that resolves when refresh is complete
 */
const pendingRefreshes = new Map<string, Promise<void>>()

/**
 * Stores lock keys with their acquisition timestamp
 * Key: refresh token or request ID
 * Value: timestamp when lock was acquired
 */
export const refreshTokenLock = new Map<string, number>()

/**
 * Clean up stale locks (older than 10 seconds)
 * This prevents locks from persisting indefinitely if something goes wrong
 */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    const staleThreshold = 10000 // 10 seconds

    for (const [key, timestamp] of refreshTokenLock.entries()) {
      if (now - timestamp > staleThreshold) {
        console.log("[refreshTokenLock] Cleaning up stale lock:", key.substring(0, 10))
        refreshTokenLock.delete(key)
        pendingRefreshes.delete(key) // Also clean up pending promises
      }
    }
  }, 5000) // Check every 5 seconds
}

/**
 * Acquire a lock for a given key with proper queue handling
 * If lock is already held, returns the existing promise to wait on
 */
export async function acquireLockWithQueue(key: string, operation: () => Promise<void>): Promise<void> {
  // If there's already a pending refresh, wait for it
  const existingPromise = pendingRefreshes.get(key)
  if (existingPromise) {
    await existingPromise
    return
  }

  // Create new promise for this refresh operation
  const refreshPromise = (async () => {
    try {
      refreshTokenLock.set(key, Date.now())
      await operation()
    } finally {
      refreshTokenLock.delete(key)
      pendingRefreshes.delete(key)
    }
  })()

  pendingRefreshes.set(key, refreshPromise)
  await refreshPromise
}

/**
 * Acquire a lock for a given key
 * Returns false if lock is already held, true if successfully acquired
 */
export function acquireLock(key: string): boolean {
  if (refreshTokenLock.has(key)) {
    return false
  }

  refreshTokenLock.set(key, Date.now())
  return true
}

/**
 * Release a lock for a given key
 */
export function releaseLock(key: string): void {
  refreshTokenLock.delete(key)
  pendingRefreshes.delete(key)
}

/**
 * Check if a lock is currently held for a given key
 */
export function isLocked(key: string): boolean {
  return refreshTokenLock.has(key)
}

/**
 * Wait for a lock to be released (with timeout)
 * Returns true if lock was released, false if timeout was reached
 */
export async function waitForLock(key: string, timeoutMs = 5000): Promise<boolean> {
  const existingPromise = pendingRefreshes.get(key)

  if (existingPromise) {
    // Wait for existing operation with timeout
    const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs))

    const resultPromise = existingPromise.then(() => true)

    return Promise.race([resultPromise, timeoutPromise])
  }

  return !refreshTokenLock.has(key)
}

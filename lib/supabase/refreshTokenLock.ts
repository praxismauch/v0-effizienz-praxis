// Stores lock keys (refresh tokens or request IDs) with their acquisition timestamp

/**
 * Shared lock Map to prevent concurrent refresh token operations
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
      }
    }
  }, 5000) // Check every 5 seconds
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
  const startTime = Date.now()

  while (refreshTokenLock.has(key) && Date.now() - startTime < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return !refreshTokenLock.has(key)
}

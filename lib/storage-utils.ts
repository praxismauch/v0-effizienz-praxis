/**
 * Secure Storage Utility
 *
 * Provides storage with TTL (time-to-live) and integrity checks.
 * Simplified version that doesn't require encryption key persistence.
 */

import Logger from "@/lib/logger"

interface StoredData {
  data: unknown
  expiresAt: number
  checksum: string
}

const DEFAULT_TTL = 3600 // 1 hour in seconds

/**
 * Generate simple checksum for integrity check
 */
function generateChecksum(data: string): string {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash.toString(36)
}

/**
 * Store data with TTL and integrity check
 */
export async function encryptStorage(data: any, ttlSeconds: number = DEFAULT_TTL): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Cannot use storage in server environment")
  }

  const dataString = JSON.stringify(data)
  const expiresAt = Date.now() + ttlSeconds * 1000
  const checksum = generateChecksum(`${dataString}:${expiresAt}`)

  const stored: StoredData = {
    data,
    expiresAt,
    checksum,
  }

  return JSON.stringify(stored)
}

/**
 * Retrieve and validate stored data
 */
export async function decryptStorage(encryptedString: string): Promise<any | null> {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const stored: StoredData = JSON.parse(encryptedString)

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      return null // Expired
    }

    // Verify integrity
    const dataString = JSON.stringify(stored.data)
    const expectedChecksum = generateChecksum(`${dataString}:${stored.expiresAt}`)
    if (expectedChecksum !== stored.checksum) {
      Logger.warn("storage", "Checksum verification failed - data may be tampered")
      return null
    }

    return stored.data
  } catch (error) {
    Logger.error("storage", "Storage decryption error", error)
    return null
  }
}

/**
 * Check if stored data is expired without decrypting
 */
export function isStorageExpired(encryptedString: string): boolean {
  try {
    const stored: StoredData = JSON.parse(encryptedString)
    return Date.now() > stored.expiresAt
  } catch {
    return true
  }
}

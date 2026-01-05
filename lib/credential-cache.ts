const CACHE_DURATION = 2592000 * 1000 // 30 days in milliseconds (2,592,000 seconds)
const CREDENTIAL_KEY_PREFIX = "effizienz_praxis_credential_"

interface CachedCredential {
  email: string
  timestamp: number
  expiresAt: number
}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

export class CredentialCache {
  /**
   * Store credentials with 30-day expiration
   * @param email User email to cache
   */
  static set(email: string): void {
    if (!isBrowser()) return

    const timestamp = Date.now()
    const expiresAt = timestamp + CACHE_DURATION

    const credential: CachedCredential = {
      email,
      timestamp,
      expiresAt,
    }

    try {
      localStorage.setItem(`${CREDENTIAL_KEY_PREFIX}email`, email)
      localStorage.setItem(`${CREDENTIAL_KEY_PREFIX}timestamp`, timestamp.toString())
      localStorage.setItem(`${CREDENTIAL_KEY_PREFIX}expiresAt`, expiresAt.toString())
      localStorage.setItem(`${CREDENTIAL_KEY_PREFIX}enabled`, "true")
    } catch (error) {
      console.error("[CredentialCache] Failed to cache credentials:", error)
    }
  }

  /**
   * Retrieve cached credentials if not expired
   * @returns Email if valid cache exists, null otherwise
   */
  static get(): string | null {
    if (!isBrowser()) return null

    try {
      const enabled = localStorage.getItem(`${CREDENTIAL_KEY_PREFIX}enabled`)
      if (enabled !== "true") {
        return null
      }

      const email = localStorage.getItem(`${CREDENTIAL_KEY_PREFIX}email`)
      const expiresAt = localStorage.getItem(`${CREDENTIAL_KEY_PREFIX}expiresAt`)

      if (!email || !expiresAt) {
        return null
      }

      const expirationTime = Number.parseInt(expiresAt, 10)
      const now = Date.now()

      // Check if cache has expired
      if (now > expirationTime) {
        this.clear()
        return null
      }

      return email
    } catch (error) {
      console.error("[CredentialCache] Failed to retrieve cached credentials:", error)
      return null
    }
  }

  /**
   * Clear all cached credentials
   */
  static clear(): void {
    if (!isBrowser()) return

    try {
      localStorage.removeItem(`${CREDENTIAL_KEY_PREFIX}email`)
      localStorage.removeItem(`${CREDENTIAL_KEY_PREFIX}timestamp`)
      localStorage.removeItem(`${CREDENTIAL_KEY_PREFIX}expiresAt`)
      localStorage.removeItem(`${CREDENTIAL_KEY_PREFIX}enabled`)
    } catch (error) {
      console.error("[CredentialCache] Failed to clear credential cache:", error)
    }
  }

  /**
   * Check if credentials are currently cached
   */
  static isEnabled(): boolean {
    if (!isBrowser()) return false

    try {
      return localStorage.getItem(`${CREDENTIAL_KEY_PREFIX}enabled`) === "true"
    } catch {
      return false
    }
  }

  /**
   * Get time remaining until cache expires
   * @returns Milliseconds until expiration, or null if no cache exists
   */
  static getTimeRemaining(): number | null {
    if (!isBrowser()) return null

    try {
      const expiresAt = localStorage.getItem(`${CREDENTIAL_KEY_PREFIX}expiresAt`)
      if (!expiresAt) {
        return null
      }

      const expirationTime = Number.parseInt(expiresAt, 10)
      const now = Date.now()
      const remaining = expirationTime - now

      return remaining > 0 ? remaining : null
    } catch {
      return null
    }
  }
}

/**
 * Simple encryption utilities for sensitive data storage
 * Uses AES-256-GCM for encryption
 *
 * NOTE: In production, consider using a dedicated secrets manager
 * like HashiCorp Vault, AWS Secrets Manager, or similar
 */

const ALGORITHM = "AES-GCM"
const KEY_LENGTH = 256
const IV_LENGTH = 12
const TAG_LENGTH = 128

// Cached encryption key to prevent repeated env access
let cachedEncryptionKey: string | null = null

// Get encryption key from environment or generate a default
// Lazy initialization to prevent TDZ errors
function getEncryptionKey(): string {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey
  }

  try {
    const key = typeof process !== "undefined" && process.env ? process.env.ENCRYPTION_KEY : undefined
    if (!key) {
      console.warn("[Encryption] ENCRYPTION_KEY not set, using fallback. Set ENCRYPTION_KEY in production!")
      // Fallback key for development - DO NOT use in production
      cachedEncryptionKey = "effizienz-praxis-dev-key-32chars!"
    } else {
      cachedEncryptionKey = key
    }
  } catch {
    console.warn("[Encryption] Error accessing ENCRYPTION_KEY, using fallback")
    cachedEncryptionKey = "effizienz-praxis-dev-key-32chars!"
  }

  return cachedEncryptionKey
}

/**
 * Encrypt a string value
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return ""

  // In SSR environment, return a placeholder
  if (typeof window === "undefined" && typeof crypto === "undefined") {
    // Use a simple base64 encoding as fallback for SSR
    return `enc:${Buffer.from(plaintext).toString("base64")}`
  }

  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(getEncryptionKey().slice(0, 32).padEnd(32, "0")),
      { name: ALGORITHM },
      false,
      ["encrypt"],
    )

    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

    const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv, tagLength: TAG_LENGTH }, keyMaterial, data)

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)

    // Return as base64 with prefix
    return `enc:${Buffer.from(combined).toString("base64")}`
  } catch (error) {
    console.error("[Encryption] Failed to encrypt:", error)
    // Fallback to base64 encoding
    return `enc:${Buffer.from(plaintext).toString("base64")}`
  }
}

/**
 * Decrypt a string value
 */
export async function decrypt(ciphertext: string): Promise<string> {
  if (!ciphertext) return ""

  // Check if it's an encrypted value
  if (!ciphertext.startsWith("enc:")) {
    // Return as-is if not encrypted (backward compatibility)
    return ciphertext
  }

  const encoded = ciphertext.slice(4) // Remove "enc:" prefix

  // In SSR environment or if crypto is unavailable
  if (typeof window === "undefined" && typeof crypto === "undefined") {
    try {
      return Buffer.from(encoded, "base64").toString("utf-8")
    } catch {
      return ciphertext
    }
  }

  try {
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const combined = Buffer.from(encoded, "base64")
    const iv = combined.slice(0, IV_LENGTH)
    const data = combined.slice(IV_LENGTH)

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(getEncryptionKey().slice(0, 32).padEnd(32, "0")),
      { name: ALGORITHM },
      false,
      ["decrypt"],
    )

    const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv, tagLength: TAG_LENGTH }, keyMaterial, data)

    return decoder.decode(decrypted)
  } catch (error) {
    console.error("[Encryption] Failed to decrypt:", error)
    // Try base64 decode as fallback
    try {
      return Buffer.from(encoded, "base64").toString("utf-8")
    } catch {
      return ciphertext
    }
  }
}

/**
 * Check if a value is encrypted
 */
export function isEncrypted(value: string): boolean {
  return value?.startsWith("enc:")
}

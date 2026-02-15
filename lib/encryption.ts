/**
 * Simple encryption utilities for sensitive data storage
 * Uses AES-256-GCM for encryption
 *
 * Server-side encryption using Node.js crypto module for better security
 * NOTE: In production, consider using a dedicated secrets manager
 * like HashiCorp Vault, AWS Secrets Manager, or similar
 */

import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16 // 16 bytes for AES
const TAG_LENGTH = 16 // 16 bytes for authentication tag
const KEY_LENGTH = 32 // 32 bytes for AES-256

// Cached encryption key to prevent repeated env access
let cachedEncryptionKey: Buffer | null = null

/**
 * Get encryption key from environment
 * Derives a consistent 32-byte key from the ENCRYPTION_KEY env var
 */
function getEncryptionKey(): Buffer {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey
  }

  try {
    const key = process.env.ENCRYPTION_KEY

    if (!key) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("ENCRYPTION_KEY environment variable is required in production")
      }
      console.warn("[Encryption] ENCRYPTION_KEY not set, using fallback. Set ENCRYPTION_KEY in production!")
      // Fallback key for development - DO NOT use in production
      const fallbackKey = "effizienz-praxis-dev-key-32chars!"
      cachedEncryptionKey = crypto.scryptSync(fallbackKey, "salt", KEY_LENGTH)
    } else {
      // Derive a consistent key from the environment variable
      cachedEncryptionKey = crypto.scryptSync(key, "effizienz-praxis-salt", KEY_LENGTH)
    }
  } catch (error) {
    console.error("[Encryption] Error accessing ENCRYPTION_KEY:", error)
    throw new Error("Failed to initialize encryption key")
  }

  return cachedEncryptionKey
}

/**
 * Encrypt a string value using AES-256-GCM
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format: enc:iv:tag:ciphertext (all base64)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return ""

  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Encrypt the data
    let encrypted = cipher.update(plaintext, "utf8", "base64")
    encrypted += cipher.final("base64")

    // Get authentication tag
    const tag = cipher.getAuthTag()

    // Return format: enc:iv:tag:ciphertext
    return `enc:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted}`
  } catch (error) {
    console.error("[Encryption] Failed to encrypt:", error)
    throw new Error("Encryption failed")
  }
}

/**
 * Decrypt a string value using AES-256-GCM
 * @param ciphertext - The encrypted string in format: enc:iv:tag:ciphertext
 * @returns Decrypted plaintext string
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ""

  // Check if it's an encrypted value
  if (!ciphertext.startsWith("enc:")) {
    // Return as-is if not encrypted (backward compatibility)
    return ciphertext
  }

  try {
    const key = getEncryptionKey()

    // Split the encrypted data
    const parts = ciphertext.slice(4).split(":") // Remove "enc:" prefix
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format")
    }

    const [ivBase64, tagBase64, encrypted] = parts

    // Convert from base64
    const iv = Buffer.from(ivBase64, "base64")
    const tag = Buffer.from(tagBase64, "base64")

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    // Decrypt the data
    let decrypted = decipher.update(encrypted, "base64", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("[Encryption] Failed to decrypt:", error)
    throw new Error("Decryption failed")
  }
}

/**
 * Check if a value is encrypted
 */
export function isEncrypted(value: string): boolean {
  return value?.startsWith("enc:")
}

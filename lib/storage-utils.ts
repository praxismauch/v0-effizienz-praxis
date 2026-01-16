/**
 * Secure Storage Utility
 *
 * Provides encrypted storage with TTL (time-to-live) and integrity checks.
 * Uses Web Crypto API for AES-GCM encryption and HMAC for integrity.
 */

interface StoredData {
  data: string
  iv: string
  expiresAt: number
  hmac: string
}

const ENCRYPTION_KEY_NAME = "effizienz-storage-key"
const DEFAULT_TTL = 3600 // 1 hour in seconds

/**
 * Get or create encryption key for storage
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  if (typeof window === "undefined") {
    throw new Error("Storage utils can only be used in browser")
  }

  // Try to get existing key from session
  const existingKeyData = sessionStorage.getItem(ENCRYPTION_KEY_NAME)
  if (existingKeyData) {
    try {
      const keyData = JSON.parse(existingKeyData)
      return await crypto.subtle.importKey("jwk", keyData, { name: "AES-GCM", length: 256 }, true, [
        "encrypt",
        "decrypt",
      ])
    } catch (e) {
      // Key corrupted, generate new one
    }
  }

  // Generate new key
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])

  // Store key for this session
  const exportedKey = await crypto.subtle.exportKey("jwk", key)
  sessionStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exportedKey))

  return key
}

/**
 * Generate HMAC for integrity check
 */
async function generateHMAC(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(ENCRYPTION_KEY_NAME),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )

  const signature = await crypto.subtle.sign("HMAC", keyMaterial, encoder.encode(data))

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Verify HMAC integrity
 */
async function verifyHMAC(data: string, expectedHMAC: string): Promise<boolean> {
  const actualHMAC = await generateHMAC(data)
  return actualHMAC === expectedHMAC
}

/**
 * Encrypt and store data with TTL
 */
export async function encryptStorage(data: any, ttlSeconds: number = DEFAULT_TTL): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Cannot use storage in server environment")
  }

  const key = await getEncryptionKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoder = new TextEncoder()
  const dataString = JSON.stringify(data)

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(dataString))

  const encryptedData = Array.from(new Uint8Array(encrypted))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  const ivString = Array.from(iv)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  const expiresAt = Date.now() + ttlSeconds * 1000
  const payload = `${encryptedData}:${ivString}:${expiresAt}`
  const hmac = await generateHMAC(payload)

  const stored: StoredData = {
    data: encryptedData,
    iv: ivString,
    expiresAt,
    hmac,
  }

  return JSON.stringify(stored)
}

/**
 * Decrypt and validate stored data
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
    const payload = `${stored.data}:${stored.iv}:${stored.expiresAt}`
    const isValid = await verifyHMAC(payload, stored.hmac)
    if (!isValid) {
      console.warn("[storage] HMAC verification failed - data may be tampered")
      return null
    }

    // Decrypt
    const key = await getEncryptionKey()
    const iv = new Uint8Array(stored.iv.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16)))
    const encryptedData = new Uint8Array(stored.data.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16)))

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encryptedData)

    const decoder = new TextDecoder()
    const dataString = decoder.decode(decrypted)
    return JSON.parse(dataString)
  } catch (e) {
    console.error("[storage] Decryption error:", e)
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

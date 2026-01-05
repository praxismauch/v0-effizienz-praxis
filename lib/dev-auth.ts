// Development-only authentication utilities
// NEVER runs in production - only for local development testing

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function getLocalStorageItem(key: string): string | null {
  if (!isBrowser()) return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function setLocalStorageItem(key: string, value: string): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore storage errors
  }
}

function removeLocalStorageItem(key: string): void {
  if (!isBrowser()) return
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore storage errors
  }
}

function isAutoLoginEnabled(): boolean {
  if (isBrowser()) {
    const devMode = getLocalStorageItem("v0_dev_mode")
    if (devMode === "true") return true
  }
  return process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true"
}

export const DEV_CONFIG = {
  get enabled() {
    return isAutoLoginEnabled()
  },
  email: process.env.NEXT_PUBLIC_DEV_USER_EMAIL || "mauch.daniel@googlemail.com",
  password: "", // Leave empty - handled by bypass
  userId: "dev-user-123",
  name: "Dev User",
  role: "admin" as const,
  practiceId: "practice-demo-001",
  sessionDuration: 30 * 24 * 60 * 60, // 2,592,000 seconds (30 days)
}

export function isAutoLoginTemporarilyDisabled(): boolean {
  return getLocalStorageItem("disable_auto_login") === "true"
}

export function disableAutoLoginTemporarily(): void {
  setLocalStorageItem("disable_auto_login", "true")
}

export function enableAutoLogin(): void {
  removeLocalStorageItem("disable_auto_login")
}

export function isDevAutoLoginEnabled(): boolean {
  if (isAutoLoginTemporarilyDisabled()) {
    return false
  }
  return isAutoLoginEnabled()
}

export function getDevUser() {
  if (!isDevAutoLoginEnabled()) {
    return null
  }

  return {
    id: DEV_CONFIG.userId,
    name: DEV_CONFIG.name,
    email: DEV_CONFIG.email,
    role: DEV_CONFIG.role,
    practiceId: DEV_CONFIG.practiceId,
    isActive: true,
    joinedAt: new Date().toISOString().split("T")[0],
    preferred_language: "de",
  }
}

export function getDevCredentials() {
  if (!isDevAutoLoginEnabled()) {
    return null
  }

  return {
    email: DEV_CONFIG.email,
    password: DEV_CONFIG.password,
  }
}

export function markAsDevUser(email: string): void {
  if (email === DEV_CONFIG.email) {
    setLocalStorageItem("dev_user_email", email)
    // Set expiration timestamp for 30 days from now
    const expiresAt = Date.now() + DEV_CONFIG.sessionDuration * 1000
    setLocalStorageItem("dev_session_expires", expiresAt.toString())
  }
}

export function isDevSessionValid(): boolean {
  if (!isDevAutoLoginEnabled()) {
    return false
  }

  const expiresAt = getLocalStorageItem("dev_session_expires")
  if (!expiresAt) {
    return false
  }

  return Date.now() < Number.parseInt(expiresAt)
}

export function clearDevSession(): void {
  removeLocalStorageItem("dev_user_email")
  removeLocalStorageItem("dev_session_expires")
  removeLocalStorageItem("disable_auto_login")
}

/**
 * Environment variable validation and type-safe access
 * Validates required environment variables at build/runtime
 */

// Required environment variables
const REQUIRED_ENV_VARS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const

// Optional but recommended environment variables
const RECOMMENDED_ENV_VARS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SMTP_HOST",
  "SMTP_USERNAME",
  "OPENAI_API_KEY",
  "BLOB_READ_WRITE_TOKEN",
  "ENCRYPTION_KEY",
  "CRON_SECRET",
] as const

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number]
type RecommendedEnvVar = (typeof RECOMMENDED_ENV_VARS)[number]

/**
 * Validate that all required environment variables are set
 * Note: This should only be called on the server side
 */
export function validateEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  // Only run validation on server
  if (typeof window !== "undefined") {
    return { valid: true, missing: [], warnings: [] }
  }

  const missing: string[] = []
  const warnings: string[] = []

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL")
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) warnings.push("SUPABASE_SERVICE_ROLE_KEY")
  if (!process.env.SMTP_HOST) warnings.push("SMTP_HOST")
  if (!process.env.SMTP_USERNAME) warnings.push("SMTP_USERNAME")
  if (!process.env.OPENAI_API_KEY) warnings.push("OPENAI_API_KEY")
  if (!process.env.BLOB_READ_WRITE_TOKEN) warnings.push("BLOB_READ_WRITE_TOKEN")
  if (!process.env.ENCRYPTION_KEY) warnings.push("ENCRYPTION_KEY")
  if (!process.env.CRON_SECRET) warnings.push("CRON_SECRET")

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  }
}

/**
 * Get environment variable with type safety
 * Note: This should only be called on the server side for non-NEXT_PUBLIC_ vars
 */
export function getEnv(key: RequiredEnvVar): string {
  // Only allow on server
  if (typeof window !== "undefined") {
    throw new Error(`getEnv() can only be called on the server side`)
  }

  let value: string | undefined
  switch (key) {
    case "NEXT_PUBLIC_SUPABASE_URL":
      value = process.env.NEXT_PUBLIC_SUPABASE_URL
      break
    case "NEXT_PUBLIC_SUPABASE_ANON_KEY":
      value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      break
  }

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

/**
 * Get optional environment variable
 * Note: This should only be called on the server side for non-NEXT_PUBLIC_ vars
 */
export function getOptionalEnv(key: string, defaultValue?: string): string | undefined {
  // Only allow on server
  if (typeof window !== "undefined") {
    return defaultValue
  }

  // This file should only be imported in server components/routes
  return (process.env as Record<string, string | undefined>)[key] || defaultValue
}

/**
 * Check if running in production
 * Uses NEXT_PUBLIC_VERCEL_ENV for client compatibility
 */
export function isProduction(): boolean {
  try {
    if (typeof window !== "undefined") {
      return process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    }
    return process.env.NODE_ENV === "production"
  } catch {
    return false
  }
}

/**
 * Check if running in development
 * Uses NEXT_PUBLIC_VERCEL_ENV for client compatibility
 */
export function isDevelopment(): boolean {
  try {
    if (typeof window !== "undefined") {
      const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV
      return !vercelEnv || vercelEnv === "development" || vercelEnv === "preview"
    }
    return process.env.NODE_ENV === "development"
  } catch {
    return true
  }
}

// REMOVED: Module-level constant exports that cause TDZ errors
// Use isProduction() and isDevelopment() functions instead
// export const IS_PRODUCTION = isProduction()
// export const IS_DEVELOPMENT = isDevelopment()

/**
 * Get the app URL
 * Priority: NEXT_PUBLIC_APP_URL > VERCEL_URL > localhost
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return "http://localhost:3000"
}

/**
 * Get the base URL for server-side operations
 * Automatically handles Vercel deployment URLs
 */
export function getBaseUrl(): string {
  // Client-side: use relative URLs
  if (typeof window !== "undefined") {
    return ""
  }
  // Server-side: use environment variables
  return getAppUrl()
}

// Constants file for Next.js configuration
// This file is required by Next.js internal configuration

export const APP_NAME = "Effizienz Praxis"
export const APP_VERSION = "1.0.0"

// Add any shared constants here
export const DEFAULT_LOCALE = "de"
export const SUPPORTED_LOCALES = ["de", "en"]

// API routes - Use getter function to avoid TDZ errors
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "/api"
}

// Supabase - Use getter functions to avoid TDZ errors
export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL
}

export function getSupabaseAnonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

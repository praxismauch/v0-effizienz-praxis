/**
 * Supabase configuration
 * 
 * ⚠️ ACTION REQUIRED FOR V0 PREVIEW ⚠️
 * 
 * The environment variables in your Vars section are not being picked up in the preview.
 * To make the app work, paste your Supabase credentials directly below:
 * 
 * 1. Get from Supabase dashboard (https://supabase.com/dashboard > Settings > API):
 *    - Project URL (looks like: https://xxxxx.supabase.co)
 *    - anon/public key (starts with: eyJ...)
 *    - service_role key (starts with: eyJ...)
 * 
 * 2. Paste them in the three constants below (in quotes)
 * 
 * These values will ONLY be used in v0 preview. When deployed to Vercel,
 * the environment variables from your Vars section will be used instead.
 */

// 🔽 PASTE YOUR SUPABASE CREDENTIALS HERE 🔽
const SUPABASE_URL_FALLBACK = "" // Example: "https://abcdefgh.supabase.co"
const SUPABASE_ANON_KEY_FALLBACK = "" // Example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
const SUPABASE_SERVICE_ROLE_KEY_FALLBACK = "" // Example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// Get environment variables with fallbacks for v0 preview
export const getSupabaseUrl = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    SUPABASE_URL_FALLBACK
  )
}

export const getSupabaseAnonKey = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_ANON_KEY_FALLBACK
  )
}

export const getSupabaseServiceRoleKey = () => {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    SUPABASE_SERVICE_ROLE_KEY_FALLBACK
  )
}

// Validation helpers
export const hasSupabaseConfig = () => {
  return !!(getSupabaseUrl() && getSupabaseAnonKey())
}

export const hasSupabaseAdminConfig = () => {
  return !!(getSupabaseUrl() && getSupabaseServiceRoleKey())
}

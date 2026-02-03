/**
 * Supabase configuration
 * 
 * INSTRUCTIONS FOR V0 PREVIEW:
 * The environment variables you set in the Vars section should work automatically.
 * If they don't appear in the preview, you can hardcode them here as fallbacks:
 * 
 * 1. Go to your Supabase dashboard: https://supabase.com/dashboard
 * 2. Select your project
 * 3. Go to Settings > API
 * 4. Copy the values and paste them below:
 *    - Project URL -> SUPABASE_URL_FALLBACK
 *    - anon/public key -> SUPABASE_ANON_KEY_FALLBACK
 *    - service_role key -> SUPABASE_SERVICE_ROLE_KEY_FALLBACK
 * 
 * For production deployment, these will automatically use environment variables from Vercel.
 */

// Fallback values for v0 preview (optional - only if env vars don't work)
const SUPABASE_URL_FALLBACK = ""
const SUPABASE_ANON_KEY_FALLBACK = ""
const SUPABASE_SERVICE_ROLE_KEY_FALLBACK = ""

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

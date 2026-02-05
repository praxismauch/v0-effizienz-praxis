/**
 * Supabase Configuration
 * 
 * Environment variables are loaded from Vercel project settings.
 * Configure via v0 sidebar: Vars section or Vercel dashboard.
 * 
 * Required environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anon/public key
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (server-side only)
 */

// Get environment variables
export const getSupabaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    console.warn("[Supabase] NEXT_PUBLIC_SUPABASE_URL is not configured")
  }
  return url || ""
}

export const getSupabaseAnonKey = (): string => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
              process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!key) {
    console.warn("[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured")
  }
  return key || ""
}

export const getSupabaseServiceRoleKey = (): string => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  // Don't warn for service role key on client-side - it's only needed server-side
  return key || ""
}

// Validation helpers
export const hasSupabaseConfig = () => {
  return !!(getSupabaseUrl() && getSupabaseAnonKey())
}

export const hasSupabaseAdminConfig = () => {
  return !!(getSupabaseUrl() && getSupabaseServiceRoleKey())
}

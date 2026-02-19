/**
 * Supabase Configuration
 * 
 * Environment variables are loaded from Vercel project settings.
 * Configure via v0 sidebar: Vars section or Vercel dashboard.
 * 
 * Required environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL): Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY): Your Supabase anon/public key
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (server-side only)
 * 
 * Fallback: SUPABASE_URL / SUPABASE_ANON_KEY are used when NEXT_PUBLIC_ variants
 * are not available (e.g. server-side in v0 preview before build inlines them).
 * 
 * Updated: All admin client functions now return mock/fallback clients instead of null.
 */

// Get environment variables - read directly from process.env each time (no caching)
export const getSupabaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
}

export const getSupabaseAnonKey = (): string => {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
         process.env.SUPABASE_ANON_KEY ||
         process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
}

export const getSupabaseServiceRoleKey = (): string => {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ""
}

// Validation helpers
export const hasSupabaseConfig = (): boolean => {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  return !!(url && key)
}

export const hasSupabaseAdminConfig = (): boolean => {
  const url = getSupabaseUrl()
  const key = getSupabaseServiceRoleKey()
  return !!(url && key)
}

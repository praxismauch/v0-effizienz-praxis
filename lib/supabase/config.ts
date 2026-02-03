/**
 * Supabase configuration
 * 
 * For v0 preview, hardcode your Supabase credentials here.
 * For production deployment, these will automatically use environment variables.
 */

// Get environment variables with fallbacks for v0 preview
export const getSupabaseUrl = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    // TODO: Add your Supabase URL here for v0 preview
    ""
  )
}

export const getSupabaseAnonKey = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    // TODO: Add your Supabase anon key here for v0 preview
    ""
  )
}

export const getSupabaseServiceRoleKey = () => {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    // TODO: Add your Supabase service role key here for v0 preview
    ""
  )
}

// Validation helpers
export const hasSupabaseConfig = () => {
  return !!(getSupabaseUrl() && getSupabaseAnonKey())
}

export const hasSupabaseAdminConfig = () => {
  return !!(getSupabaseUrl() && getSupabaseServiceRoleKey())
}

import { createServerClient as supabaseCreateServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js"

// Cache for admin client (service role) - this is safe to cache as it doesn't use cookies
let adminClientCache: SupabaseClient | null = null

/**
 * Create a server client for use in Server Components and Route Handlers.
 * IMPORTANT: Always create a fresh client for each request - do not cache.
 */
export async function createClient() {
  // Import cookies dynamically to avoid client component issues
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase not configured - missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY")
    // Return a mock client that will fail gracefully
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signOut: async () => ({ error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
      },
      from: () => ({
        select: () => ({ data: null, error: { message: "Supabase not configured" } }),
        insert: () => ({ data: null, error: { message: "Supabase not configured" } }),
        update: () => ({ data: null, error: { message: "Supabase not configured" } }),
        delete: () => ({ data: null, error: { message: "Supabase not configured" } }),
      }),
    } as unknown as ReturnType<typeof supabaseCreateServerClient>
  }

  return supabaseCreateServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // setAll may be called from Server Component where cookies are read-only
          // This is expected - the middleware handles cookie updates
        }
      },
    },
  })
}

// Alias for backwards compatibility
export async function createServerClient() {
  return createClient()
}

/**
 * Create an admin client with service role key.
 * Use this for operations that need to bypass RLS.
 * This is cached since it doesn't use cookies.
 */
export async function createAdminClient() {
  if (adminClientCache) {
    return adminClientCache
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("Supabase admin client not configured - missing SUPABASE_SERVICE_ROLE_KEY")
    return null as unknown as SupabaseClient
  }

  adminClientCache = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClientCache
}

export async function getServiceRoleClient() {
  return createAdminClient()
}

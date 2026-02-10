import { createServerClient as supabaseCreateServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseUrl, getSupabaseAnonKey, getSupabaseServiceRoleKey, hasSupabaseConfig, hasSupabaseAdminConfig } from "./config"

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

  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!hasSupabaseConfig()) {
    // Supabase not configured - return mock client that supports method chaining
    const mockResult = { data: null, error: null }
    const chainable: Record<string, unknown> = {}
    const methods = ["select", "insert", "update", "delete", "upsert", "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is", "in", "contains", "containedBy", "range", "textSearch", "match", "not", "or", "filter", "order", "limit", "single", "maybeSingle", "csv", "then"]
    for (const method of methods) {
      if (method === "then") {
        chainable[method] = (resolve: (value: typeof mockResult) => void) => resolve(mockResult)
      } else if (method === "single" || method === "maybeSingle") {
        chainable[method] = () => ({ ...chainable, data: null, error: null })
      } else {
        chainable[method] = () => chainable
      }
    }
    // Make chainable also act as a thenable (Promise-like) so await works
    Object.assign(chainable, mockResult)

    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signOut: async () => ({ error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
      },
      from: () => chainable,
      rpc: async () => mockResult,
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

  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = getSupabaseServiceRoleKey()

  if (!hasSupabaseAdminConfig()) {
    console.warn("Supabase admin client not configured - add credentials to lib/supabase/config.ts")
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

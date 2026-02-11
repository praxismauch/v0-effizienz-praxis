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
    // Supabase not configured - return mock client that supports full method chaining
    // This ensures all query builder patterns (e.g. .from().select().eq().gte().order()) work
    const mockResult = { data: null, error: null, count: null, status: 200, statusText: "OK" }

    function createChainable(): Record<string, unknown> {
      const chainable: Record<string, unknown> = { ...mockResult }
      const handler = () => createChainable()
      const methods = [
        "select", "insert", "update", "delete", "upsert",
        "eq", "neq", "gt", "gte", "lt", "lte",
        "like", "ilike", "is", "in", "contains", "containedBy",
        "range", "textSearch", "match", "not", "or", "and", "filter",
        "order", "limit", "offset", "single", "maybeSingle", "csv",
        "returns", "throwOnError", "abortSignal", "rollback",
      ]
      for (const method of methods) {
        chainable[method] = handler
      }
      // Make it thenable so `await supabase.from(...).select(...)...` resolves to mockResult
      chainable.then = (resolve: (value: typeof mockResult) => void) => Promise.resolve(resolve(mockResult))
      return chainable
    }

    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signOut: async () => ({ error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
      },
      from: () => createChainable(),
      rpc: async () => mockResult,
      storage: {
        from: () => ({
          upload: async () => ({ data: null, error: null }),
          download: async () => ({ data: null, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
          remove: async () => ({ data: null, error: null }),
          list: async () => ({ data: null, error: null }),
        }),
      },
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

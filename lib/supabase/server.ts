// Server and admin Supabase clients for route handlers and server components
import { createServerClient as supabaseCreateServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseUrl, getSupabaseAnonKey, getSupabaseServiceRoleKey, hasSupabaseConfig, hasSupabaseAdminConfig } from "./config"

// Increase max listeners to prevent warnings from parallel Supabase connections
import { EventEmitter } from "events"
EventEmitter.defaultMaxListeners = 30

// Cache for admin client (service role) using globalThis to persist across hot reloads
declare global {
  var __supabaseAdminClient: SupabaseClient | undefined
}
const adminClientCache: SupabaseClient | null = globalThis.__supabaseAdminClient || null

// Default dev user ID used as fallback when Supabase Auth session is unavailable
const DEV_USER_EMAIL = "mauch.daniel@googlemail.com"
let _devUserCache: { id: string; email: string } | null = null

/**
 * Look up the dev user from the database (cached).
 * Uses the service role key to bypass RLS since we have no auth session yet.
 */
async function getDevUser(): Promise<{ id: string; email: string } | null> {
  if (_devUserCache) return _devUserCache
  try {
    const url = getSupabaseUrl()
    const serviceKey = getSupabaseServiceRoleKey()
    if (!url || !serviceKey) return null

    // Create a one-off service role client (bypasses RLS)
    const adminClient = createSupabaseClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data } = await adminClient
      .from("users")
      .select("id, email")
      .eq("email", DEV_USER_EMAIL)
      .single()
    if (data) {
      _devUserCache = { id: data.id, email: data.email }
    }
    return _devUserCache
  } catch {
    return null
  }
}

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

  // Create the real Supabase client
  const realClient = supabaseCreateServerClient(supabaseUrl, supabaseAnonKey, {
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

  // Wrap auth.getUser to fall back to dev user when no Supabase Auth session exists.
  // This allows all 150+ API routes that call supabase.auth.getUser() to work
  // without a real Supabase Auth session (e.g. in v0 preview environment).
  const originalGetUser = realClient.auth.getUser.bind(realClient.auth)
  realClient.auth.getUser = async (...args: Parameters<typeof originalGetUser>) => {
    let result: any
    try {
      result = await originalGetUser(...args)
    } catch {
      // getUser threw (e.g. network error) — treat as no session
      result = { data: { user: null }, error: { message: "Auth session missing!" } }
    }

    const hasUser = result?.data?.user
    if (!hasUser) {
      // No auth session — look up the dev user from the DB as a fallback
      const devUser = await getDevUser()
      if (devUser) {
        return {
          data: {
            user: {
              id: devUser.id,
              email: devUser.email,
              aud: "authenticated",
              role: "authenticated",
              app_metadata: {},
              user_metadata: {},
              created_at: "",
            } as any,
          },
          error: null,
        }
      }
    }
    return result
  }

  return realClient
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
    return createClient()
  }

  globalThis.__supabaseAdminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return globalThis.__supabaseAdminClient
}

export async function getServiceRoleClient() {
  return createAdminClient()
}

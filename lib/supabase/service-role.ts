import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getSupabaseUrl, getSupabaseServiceRoleKey, hasSupabaseAdminConfig } from "./config"

/**
 * Creates a mock Supabase client for when credentials aren't available.
 * All operations return empty/null results instead of crashing.
 */
function createMockServiceClient(): ReturnType<typeof createSupabaseClient> {
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
      admin: {
        listUsers: async () => ({ data: { users: [] }, error: null }),
      },
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
  } as unknown as ReturnType<typeof createSupabaseClient>
}

let _warnedOnce = false

export function createClient() {
  if (!hasSupabaseAdminConfig()) {
    if (!_warnedOnce) {
      console.warn("Supabase service-role not configured - using mock client")
      _warnedOnce = true
    }
    return createMockServiceClient()
  }

  const supabaseUrl = getSupabaseUrl()
  const supabaseServiceKey = getSupabaseServiceRoleKey()

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

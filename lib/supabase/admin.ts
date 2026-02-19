// Standalone admin client for server-side use only
// This file does NOT import from ./server to avoid next/headers dependency chain

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getSupabaseUrl, getSupabaseServiceRoleKey, hasSupabaseAdminConfig } from "./config"

declare global {
  var __supabaseAdminClientStandalone: ReturnType<typeof createSupabaseClient> | undefined
  var __supabaseAdminWarningShown: boolean | undefined
}

/**
 * Creates a mock Supabase client that supports full method chaining.
 * Used as a fallback when Supabase credentials are not configured.
 */
function createMockClient(): ReturnType<typeof createSupabaseClient> {
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

export function createAdminClient(): ReturnType<typeof createSupabaseClient> {
  // Return cached real client if available
  if (globalThis.__supabaseAdminClientStandalone) {
    return globalThis.__supabaseAdminClientStandalone
  }

  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = getSupabaseServiceRoleKey()

  // If config is not available yet, return mock but DON'T cache it
  // so next call will try again (env vars may load later)
  if (!supabaseUrl || !serviceRoleKey) {
    if (!globalThis.__supabaseAdminWarningShown) {
      console.warn("[v0] Supabase admin client not configured - using mock client fallback. URL=", !!supabaseUrl, "ServiceKey=", !!serviceRoleKey)
      globalThis.__supabaseAdminWarningShown = true
    }
    return createMockClient()
  }

  // Config is available -- create and cache the real client
  globalThis.__supabaseAdminWarningShown = false // reset warning flag
  globalThis.__supabaseAdminClientStandalone = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "x-client-info": "effizienz-praxis-admin",
      },
    },
  })

  return globalThis.__supabaseAdminClientStandalone
}

/**
 * Returns a Supabase client for API routes: prefers admin client, falls back to session client.
 * This is the safe version that never returns null.
 * 
 * IMPORTANT: Only call this from route handlers or server actions where next/headers is available.
 */
export async function getApiClient() {
  if (hasSupabaseAdminConfig()) {
    const admin = createAdminClient()
    if (admin) return admin
  }
  // Fallback: use session-based client (dynamic import to avoid top-level next/headers dep)
  const { createClient } = await import("@/lib/supabase/server")
  return createClient()
}

"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseUrl, getSupabaseAnonKey, hasSupabaseConfig } from "./config"

// Singleton instance for the browser client
let browserClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (browserClient) {
    return browserClient
  }

  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!hasSupabaseConfig()) {
    // Supabase not configured - return mock client with full method chaining support
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
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
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
    } as unknown as SupabaseClient
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)

  return browserClient
}

export function getClientSafe(): SupabaseClient | null {
  try {
    return createClient()
  } catch {
    return null
  }
}

/**
 * Async version for contexts that need to await initialization
 */
export async function getClientAsync(): Promise<SupabaseClient> {
  return createClient()
}

// Aliases for backwards compatibility
export const createBrowserSupabaseClient = createClient

export default createClient

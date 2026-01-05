/**
 * Database Connection Pool Configuration
 *
 * This module provides optimized database connections using Supabase.
 * Uses the Supabase pooled URLs (PgBouncer) for better performance.
 */

import { createClient } from "@supabase/supabase-js"

// Global pool instance (singleton pattern)
declare global {
  var __supabaseAdmin: ReturnType<typeof createClient> | undefined
}

/**
 * Get the Supabase admin client (singleton)
 * Uses service role key for server-side operations
 */
export function getSupabaseAdmin() {
  if (globalThis.__supabaseAdmin) {
    return globalThis.__supabaseAdmin
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL or Service Role Key not configured")
  }

  globalThis.__supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
  })

  return globalThis.__supabaseAdmin
}

/**
 * Execute a raw SQL query using Supabase
 * For complex queries not supported by the Supabase client
 */
export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const supabase = getSupabaseAdmin()
  const start = Date.now()

  try {
    // Use Supabase's rpc for raw SQL or the appropriate table query
    const { data, error, count } = await supabase.rpc("execute_sql", {
      query_text: text,
      query_params: params || [],
    })

    if (error) throw error

    const duration = Date.now() - start

    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn(`Slow query (${duration}ms):`, text.substring(0, 100))
    }

    return {
      rows: (data as T[]) || [],
      rowCount: count ?? (data?.length || 0),
    }
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

/**
 * Get pool statistics for monitoring
 * Note: Supabase manages pooling internally via PgBouncer
 */
export function getPoolStats() {
  return {
    pooled: {
      status: "managed_by_supabase",
      note: "Connection pooling handled by Supabase PgBouncer",
    },
  }
}

/**
 * Close connections (no-op for Supabase as it manages connections)
 */
export async function closeAllPools(): Promise<void> {
  // Supabase handles connection management internally
  globalThis.__supabaseAdmin = undefined
}

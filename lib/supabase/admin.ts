// Standalone admin client for server-side use only
// This file does NOT import from ./server to avoid next/headers dependency chain

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getSupabaseUrl, getSupabaseServiceRoleKey, hasSupabaseAdminConfig } from "./config"

declare global {
  var __supabaseAdminClientStandalone: ReturnType<typeof createSupabaseClient> | undefined
  var __supabaseAdminWarningShown: boolean | undefined
}

export function createAdminClient(): ReturnType<typeof createSupabaseClient> | null {
  if (globalThis.__supabaseAdminClientStandalone) {
    return globalThis.__supabaseAdminClientStandalone
  }

  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = getSupabaseServiceRoleKey()

  if (!hasSupabaseAdminConfig()) {
    if (!globalThis.__supabaseAdminWarningShown) {
      console.warn("Supabase admin client not configured - using session client as fallback")
      globalThis.__supabaseAdminWarningShown = true
    }
    return null
  }

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

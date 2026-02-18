// Standalone admin client for server-side use only
// This file does NOT import from ./server to avoid next/headers dependency chain

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getSupabaseUrl, getSupabaseServiceRoleKey, hasSupabaseAdminConfig } from "./config"

declare global {
  var __supabaseAdminClientStandalone: ReturnType<typeof createSupabaseClient> | undefined
}

export function createAdminClient(): ReturnType<typeof createSupabaseClient> | null {
  if (globalThis.__supabaseAdminClientStandalone) {
    return globalThis.__supabaseAdminClientStandalone
  }

  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = getSupabaseServiceRoleKey()

  if (!hasSupabaseAdminConfig()) {
    console.warn("Supabase admin client not configured - add credentials to lib/supabase/config.ts")
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
 */
export async function getApiClient() {
  const { createClient } = await import("@/lib/supabase/server")
  if (hasSupabaseAdminConfig()) {
    const admin = createAdminClient()
    if (admin) return admin
  }
  return await createClient()
}

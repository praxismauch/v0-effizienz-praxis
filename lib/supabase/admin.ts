// Standalone admin client for server-side use only
// This file does NOT import from ./server to avoid next/headers dependency chain

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

declare global {
  var __supabaseAdminClientStandalone: ReturnType<typeof createSupabaseClient> | undefined
}

function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
}

function getServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY
}

export function createAdminClient() {
  if (globalThis.__supabaseAdminClientStandalone) {
    return globalThis.__supabaseAdminClientStandalone
  }

  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = getServiceRoleKey()

  if (!supabaseUrl || !serviceRoleKey) {
    // Return null instead of throwing - let the calling code handle it
    throw new Error("Supabase admin client not configured")
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

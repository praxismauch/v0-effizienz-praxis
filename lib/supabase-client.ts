import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseUrl, getSupabaseAnonKey, hasSupabaseConfig } from "@/lib/supabase/config"

let clientInstance: SupabaseClient | null = null

export function createBrowserClient() {
  if (clientInstance) {
    return clientInstance
  }

  if (!hasSupabaseConfig()) {
    throw new Error("Supabase URL and Anon Key must be provided")
  }

  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  clientInstance = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
  return clientInstance
}

export { createSupabaseBrowserClient }

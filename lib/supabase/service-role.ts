import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getSupabaseUrl, getSupabaseServiceRoleKey, hasSupabaseAdminConfig } from "./config"

export function createClient() {
  if (!hasSupabaseAdminConfig()) {
    throw new Error("Missing Supabase service role credentials")
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

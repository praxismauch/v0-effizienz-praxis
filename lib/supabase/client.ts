"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Singleton instance for the browser client
let browserClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (browserClient) {
    return browserClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
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

export default createClient

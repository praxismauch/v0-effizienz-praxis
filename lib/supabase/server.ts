import { createServerClient as supabaseCreateServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
}

function getSupabaseAnonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
}

function getServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY
}

export function isUsingMockAdminClient(): boolean {
  return false
}

export async function createServerClient() {
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()

  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[supabase/server] Missing env vars", {
      url: !!supabaseUrl,
      anon: !!supabaseAnonKey,
    })
    throw new Error("Supabase not configured")
  }

  return supabaseCreateServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // setAll may be called from Server Component where cookies are read-only
          // This is expected - the middleware handles cookie updates
        }
      },
    },
  })
}

export async function createClient() {
  return createServerClient()
}

export async function createAdminClient() {
  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = getServiceRoleKey()

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[supabase/server] Missing service role env vars", {
      url: !!supabaseUrl,
      serviceRole: !!serviceRoleKey,
    })
    throw new Error("Supabase admin client not configured")
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function getServiceRoleClient() {
  return createAdminClient()
}

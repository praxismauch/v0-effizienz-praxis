import { createServerClient as supabaseCreateServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

declare global {
  var __supabaseAdminClient: ReturnType<typeof createSupabaseClient> | undefined
}

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
    console.error("[supabase] Missing env vars", {
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
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
            })
          })
        } catch {
          // Ignore errors from Server Components
        }
      },
    },
    auth: {
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

export async function createClient() {
  return createServerClient()
}

export async function createAdminClient() {
  if (globalThis.__supabaseAdminClient) {
    return globalThis.__supabaseAdminClient
  }

  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = getServiceRoleKey()

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[supabase] Missing service role env vars", {
      url: !!supabaseUrl,
      serviceRole: !!serviceRoleKey,
    })
    throw new Error("Supabase admin client not configured")
  }

  globalThis.__supabaseAdminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
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

  return globalThis.__supabaseAdminClient
}

export function getServiceRoleClient() {
  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = getServiceRoleKey()

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[supabase] Missing service role env vars", {
      url: !!supabaseUrl,
      serviceRole: !!serviceRoleKey,
    })
    throw new Error("Supabase admin client not configured")
  }

  if (globalThis.__supabaseAdminClient) {
    return globalThis.__supabaseAdminClient
  }

  globalThis.__supabaseAdminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
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

  return globalThis.__supabaseAdminClient
}

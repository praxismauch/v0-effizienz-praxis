import type { SupabaseClient } from "@supabase/supabase-js"

export async function safeGetUser(supabase: SupabaseClient) {
  try {
    const result = await supabase.auth.getUser()
    return result
  } catch (error) {
    console.error("[v0] auth.getUser failed:", error)
    return {
      data: { user: null },
      error: error as Error,
    }
  }
}

export async function safeGetSession(supabase: SupabaseClient) {
  try {
    const result = await supabase.auth.getSession()
    return result
  } catch (error) {
    console.error("[v0] auth.getSession failed:", error)
    return {
      data: { session: null },
      error: error as Error,
    }
  }
}

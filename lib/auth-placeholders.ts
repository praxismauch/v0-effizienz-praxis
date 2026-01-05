import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { getSupabaseAdmin } from "@/lib/db/pool"

async function getSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
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
          // Ignore errors in Server Components where cookies can't be set
        }
      },
    },
  })
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error("[v0] Error getting current user:", error.message)
      return null
    }

    return data.user?.id ?? null
  } catch (error) {
    console.error("[v0] Exception in getCurrentUserId:", error)
    return null
  }
}

export async function getCurrentPracticeId(): Promise<string | null> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user) {
      console.error("[v0] Error getting current user for practice:", error?.message)
      return null
    }

    const userId = data.user.id

    // Use admin client to query the users table (bypasses RLS)
    const adminClient = getSupabaseAdmin()
    const { data: userProfile, error: profileError } = await adminClient
      .from("users")
      .select("practice_id")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("[v0] Error loading user from public.users:", profileError.message)
      return null
    }

    return userProfile?.practice_id ?? null
  } catch (error) {
    console.error("[v0] Exception in getCurrentPracticeId:", error)
    return null
  }
}

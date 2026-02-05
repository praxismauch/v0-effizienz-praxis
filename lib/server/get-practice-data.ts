import { createServerClient } from "@/lib/supabase/server"
import { cache } from "react"

export interface Practice {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo?: string
  created_at: string
  settings?: Record<string, unknown>
}

/**
 * Server-side utility to get practice data by ID
 * Uses React's cache() to dedupe requests within a single render
 */
export const getPracticeById = cache(async (practiceId: string): Promise<Practice | null> => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("practices")
      .select("*")
      .eq("id", practiceId)
      .maybeSingle()

    if (error) {
      console.error("[Server] Error fetching practice:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("[Server] Error getting practice:", error)
    return null
  }
})

/**
 * Server-side utility to get current user's practice
 * Combines getCurrentUser + getPracticeById for convenience
 */
export const getCurrentPractice = cache(async (): Promise<Practice | null> => {
  try {
    const supabase = await createServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return null
    }

    // Get user's practice_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("practice_id")
      .eq("id", user.id)
      .maybeSingle()

    if (userError || !userData?.practice_id) {
      return null
    }

    // Get practice data
    return getPracticeById(userData.practice_id.toString())
  } catch (error) {
    console.error("[Server] Error getting current practice:", error)
    return null
  }
})

/**
 * Server-side utility to get all practices (admin only)
 */
export const getAllPractices = cache(async (): Promise<Practice[]> => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("practices")
      .select("*")
      .order("name")

    if (error) {
      console.error("[Server] Error fetching practices:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[Server] Error getting all practices:", error)
    return []
  }
})

/**
 * Server-side utility to get practice settings
 */
export const getPracticeSettings = cache(async (practiceId: string): Promise<Record<string, unknown>> => {
  const practice = await getPracticeById(practiceId)
  return practice?.settings || {}
})

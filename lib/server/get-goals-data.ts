import { cache } from "react"
import { createServerClient } from "@/lib/supabase/server"

/**
 * Get all goals for a practice
 */
export const getGoalsByPractice = cache(async (practiceId: string) => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching goals:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error getting goals:", error)
    return []
  }
})

/**
 * Get a single goal by ID
 */
export const getGoalById = cache(async (goalId: string, practiceId: string) => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("id", goalId)
      .eq("practice_id", practiceId)
      .single()

    if (error) {
      console.error("Error fetching goal by ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error getting goal by ID:", error)
    return null
  }
})

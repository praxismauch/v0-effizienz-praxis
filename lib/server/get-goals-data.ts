import { cache } from "react"
import { createServerClient } from "@/lib/supabase/server"

/**
 * Get all goals for a practice
 */
export const getGoalsByPractice = cache(async (practiceId: string) => {
  try {
    const supabase = await createServerClient()
    const practiceIdNum = parseInt(practiceId, 10)
    
    console.log("[v0] Fetching goals for practice:", practiceIdNum)
    
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("practice_id", practiceIdNum)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching goals:", error)
      return []
    }

    console.log("[v0] Found", data?.length || 0, "goals")
    return data || []
  } catch (error) {
    console.error("[v0] Error getting goals:", error)
    return []
  }
})

/**
 * Get a single goal by ID
 */
export const getGoalById = cache(async (goalId: string, practiceId: string) => {
  try {
    const supabase = await createServerClient()
    const practiceIdNum = parseInt(practiceId, 10)
    
    console.log("[v0] Fetching goal:", goalId, "for practice:", practiceIdNum)
    
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("id", goalId)
      .eq("practice_id", practiceIdNum)
      .single()

    if (error) {
      console.error("[v0] Error fetching goal by ID:", error)
      return null
    }

    console.log("[v0] Found goal:", data ? "yes" : "no")
    return data
  } catch (error) {
    console.error("[v0] Error getting goal by ID:", error)
    return null
  }
})

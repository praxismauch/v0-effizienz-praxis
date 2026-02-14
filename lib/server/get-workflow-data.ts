import { cache } from "react"
import { createServerClient } from "@/lib/supabase/server"

/**
 * Get all workflows for a practice
 */
export const getWorkflowsByPractice = cache(async (practiceId: string) => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching workflows:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error getting workflows:", error)
    return []
  }
})

/**
 * Get a single workflow by ID
 */
export const getWorkflowById = cache(async (workflowId: string, practiceId: string) => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .eq("practice_id", practiceId)
      .single()

    if (error) {
      console.error("Error fetching workflow by ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error getting workflow by ID:", error)
    return null
  }
})

import { cache } from "react"
import { createServerClient } from "@/lib/supabase/server"

/**
 * Get all workflows for a practice
 */
export const getWorkflowsByPractice = cache(async (practiceId: string) => {
  try {
    const supabase = await createServerClient()
    const practiceIdNum = parseInt(practiceId, 10)
    
    console.log("[v0] Fetching workflows for practice:", practiceIdNum)
    
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("practice_id", practiceIdNum)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching workflows:", error)
      return []
    }

    console.log("[v0] Found", data?.length || 0, "workflows")
    return data || []
  } catch (error) {
    console.error("[v0] Error getting workflows:", error)
    return []
  }
})

/**
 * Get a single workflow by ID
 */
export const getWorkflowById = cache(async (workflowId: string, practiceId: string) => {
  try {
    const supabase = await createServerClient()
    const practiceIdNum = parseInt(practiceId, 10)
    
    console.log("[v0] Fetching workflow:", workflowId, "for practice:", practiceIdNum)
    
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .eq("practice_id", practiceIdNum)
      .single()

    if (error) {
      console.error("[v0] Error fetching workflow by ID:", error)
      return null
    }

    console.log("[v0] Found workflow:", data ? "yes" : "no")
    return data
  } catch (error) {
    console.error("[v0] Error getting workflow by ID:", error)
    return null
  }
})

import { createServerClient } from "@/lib/supabase/server"
import { cache } from "react"

export interface Todo {
  id: string
  title: string
  description?: string
  status: "todo" | "in_progress" | "completed"
  priority?: "low" | "medium" | "high"
  due_date?: string
  assigned_to?: string
  practice_id: string
  created_at: string
  updated_at?: string
}

/**
 * Get all todos for a practice
 */
export const getTodosByPractice = cache(async (practiceId: string): Promise<Todo[]> => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Server] Error fetching todos:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[Server] Error getting todos:", error)
    return []
  }
})

/**
 * Get active (non-completed) todos for a practice
 */
export const getActiveTodos = cache(async (practiceId: string): Promise<Todo[]> => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("practice_id", practiceId)
      .neq("status", "completed")
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true })

    if (error) {
      console.error("[Server] Error fetching active todos:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[Server] Error getting active todos:", error)
    return []
  }
})

/**
 * Get a specific todo by ID
 */
export const getTodoById = cache(async (todoId: string): Promise<Todo | null> => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("id", todoId)
      .maybeSingle()

    if (error) {
      console.error("[Server] Error fetching todo:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("[Server] Error getting todo:", error)
    return null
  }
})

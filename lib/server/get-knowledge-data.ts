import { cache } from "react"
import { createServerClient } from "@/lib/supabase/server"

/**
 * Get all documents for a practice
 */
export const getDocumentsByPractice = cache(async (practiceId: string) => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching documents:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error getting documents:", error)
    return []
  }
})

/**
 * Get a single document by ID
 */
export const getDocumentById = cache(async (documentId: string, practiceId: string) => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("practice_id", practiceId)
      .single()

    if (error) {
      console.error("Error fetching document by ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error getting document by ID:", error)
    return null
  }
})

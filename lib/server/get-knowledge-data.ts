import { cache } from "react"
import { createServerClient } from "@/lib/supabase/server"

/**
 * Get all documents for a practice
 */
export const getDocumentsByPractice = cache(async (practiceId: string) => {
  try {
    const supabase = await createServerClient()
    const practiceIdNum = parseInt(practiceId, 10)
    
    console.log("[v0] Fetching documents for practice:", practiceIdNum)
    
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("practice_id", practiceIdNum)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching documents:", error)
      return []
    }

    console.log("[v0] Found", data?.length || 0, "documents")
    return data || []
  } catch (error) {
    console.error("[v0] Error getting documents:", error)
    return []
  }
})

/**
 * Get a single document by ID
 */
export const getDocumentById = cache(async (documentId: string, practiceId: string) => {
  try {
    const supabase = await createServerClient()
    const practiceIdNum = parseInt(practiceId, 10)
    
    console.log("[v0] Fetching document:", documentId, "for practice:", practiceIdNum)
    
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("practice_id", practiceIdNum)
      .single()

    if (error) {
      console.error("[v0] Error fetching document by ID:", error)
      return null
    }

    console.log("[v0] Found document:", data ? "yes" : "no")
    return data
  } catch (error) {
    console.error("[v0] Error getting document by ID:", error)
    return null
  }
})

import { createServerClient } from "@/lib/supabase/server"
import { cache } from "react"

export interface Team {
  id: string
  name: string
  description?: string
  practice_id: string
  created_at: string
  updated_at?: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role?: string
  joined_at: string
  practice_id: string
}

/**
 * Get all teams for a practice
 */
export const getTeamsByPractice = cache(async (practiceId: string): Promise<Team[]> => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("practice_id", practiceId)
      .order("name")

    if (error) {
      console.error("[Server] Error fetching teams:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[Server] Error getting teams:", error)
    return []
  }
})

/**
 * Get a specific team by ID
 */
export const getTeamById = cache(async (teamId: string): Promise<Team | null> => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .maybeSingle()

    if (error) {
      console.error("[Server] Error fetching team:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("[Server] Error getting team:", error)
    return null
  }
})

/**
 * Get team members for a specific team
 */
export const getTeamMembers = cache(async (teamId: string): Promise<TeamMember[]> => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .order("joined_at")

    if (error) {
      console.error("[Server] Error fetching team members:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[Server] Error getting team members:", error)
    return []
  }
})

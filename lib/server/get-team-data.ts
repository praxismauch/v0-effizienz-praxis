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

/**
 * Get all team members for a practice
 */
export const getTeamMembersByPractice = cache(async (practiceId: string): Promise<any[]> => {
  try {
    const supabase = await createServerClient()
    
    // Convert practiceId to number since database stores it as integer
    const practiceIdNum = parseInt(practiceId, 10)
    
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("practice_id", practiceIdNum)
      .is("deleted_at", null)
      .order("created_at")

    if (error) {
      console.error("Error fetching team members by practice:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error getting team members by practice:", error)
    return []
  }
})

/**
 * Get a single team member by ID
 */
export const getTeamMemberById = cache(async (memberId: string, practiceId: string): Promise<any | null> => {
  try {
    const supabase = await createServerClient()
    
    // Convert practiceId to number since database stores it as integer
    const practiceIdNum = parseInt(practiceId, 10)
    
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("id", memberId)
      .eq("practice_id", practiceIdNum)
      .is("deleted_at", null)
      .maybeSingle()

    if (error) {
      console.error("Error fetching team member by ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error getting team member by ID:", error)
    return null
  }
})

/**
 * Get all team-related data for a practice (teams + members)
 */
export const getAllTeamData = cache(async (practiceId: string) => {
  try {
    const supabase = await createServerClient()

    const [teams, teamMembers, staffingPlansResult] = await Promise.all([
      getTeamsByPractice(practiceId),
      getTeamMembersByPractice(practiceId),
      supabase
        .from("staffing_plans")
        .select("*")
        .eq("practice_id", practiceId)
        .order("created_at", { ascending: false }),
    ])

    return {
      teams,
      teamMembers,
      responsibilities: [],
      staffingPlans: staffingPlansResult.data || [],
      holidayRequests: [],
      sickLeaves: [],
    }
  } catch (error) {
    console.error("Error getting all team data:", error)
    return {
      teams: [],
      teamMembers: [],
      responsibilities: [],
      staffingPlans: [],
      holidayRequests: [],
      sickLeaves: [],
    }
  }
})

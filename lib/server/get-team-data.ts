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
    
    // First get all teams for this practice
    const { data: teams } = await supabase
      .from("teams")
      .select("id")
      .eq("practice_id", practiceId)
    
    if (!teams || teams.length === 0) {
      console.log("[v0] No teams found for practice:", practiceId)
      return []
    }
    
    const teamIds = teams.map(t => t.id)
    console.log("[v0] Found", teams.length, "teams, fetching members for team IDs:", teamIds)
    
    // Then get all team members for those teams
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .in("team_id", teamIds)
      .order("created_at")

    if (error) {
      console.error("[v0] Error fetching team members by practice:", error)
      return []
    }

    console.log("[v0] Found", data?.length || 0, "team members")
    return data || []
  } catch (error) {
    console.error("[v0] Error getting team members by practice:", error)
    return []
  }
})

/**
 * Get all team-related data for a practice (teams + members)
 */
export const getAllTeamData = cache(async (practiceId: string) => {
  try {
    console.log("[v0] getAllTeamData called for practiceId:", practiceId)
    
    const [teams, teamMembers] = await Promise.all([
      getTeamsByPractice(practiceId),
      getTeamMembersByPractice(practiceId),
    ])

    console.log("[v0] getAllTeamData results - teams:", teams.length, "teamMembers:", teamMembers.length)

    return {
      teams,
      teamMembers,
      responsibilities: [], // TODO: Add responsibilities table
      staffingPlans: [], // TODO: Add staffing plans table
      holidayRequests: [], // TODO: Add holiday requests table
      sickLeaves: [], // TODO: Add sick leaves table
    }
  } catch (error) {
    console.error("[v0] Error getting all team data:", error)
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

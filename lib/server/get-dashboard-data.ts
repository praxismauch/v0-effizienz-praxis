import { createServerClient } from "@/lib/supabase/server"
import { cache } from "react"

export interface DashboardData {
  totalTeams: number
  totalMembers: number
  activeTodos: number
  completedTodos: number
  upcomingEvents: number
  recentActivity: Array<{
    id: string
    type: string
    title: string
    timestamp: string
  }>
}

/**
 * Server-side utility to fetch dashboard data
 * Uses React's cache() to dedupe requests within a single render
 */
export const getDashboardData = cache(async (practiceId: string): Promise<DashboardData> => {
  try {
    const supabase = await createServerClient()
    
    // Fetch all dashboard data in parallel for maximum performance
    const [teamsData, membersData, todosData, eventsData, activityData] = await Promise.all([
      supabase
        .from("teams")
        .select("id")
        .eq("practice_id", practiceId),
      
      supabase
        .from("team_members")
        .select("id")
        .eq("practice_id", practiceId),
      
      supabase
        .from("todos")
        .select("id, status")
        .eq("practice_id", practiceId),
      
      supabase
        .from("calendar_events")
        .select("id, start_time")
        .eq("practice_id", practiceId)
        .gte("start_time", new Date().toISOString())
        .limit(10),
      
      // Fetch recent activity from system logs
      supabase
        .from("system_logs")
        .select("id, action, category, message, created_at")
        .eq("practice_id", practiceId)
        .order("created_at", { ascending: false })
        .limit(10),
    ])

    // Calculate stats
    const activeTodos = todosData.data?.filter(t => t.status !== "completed").length || 0
    const completedTodos = todosData.data?.filter(t => t.status === "completed").length || 0

    // Format recent activity
    const recentActivity = (activityData.data || []).map(activity => ({
      id: activity.id,
      type: activity.category || "unknown",
      title: activity.message || `${activity.action || "Aktion"} ${activity.category || ""}`.trim(),
      timestamp: activity.created_at,
    }))

    return {
      totalTeams: teamsData.data?.length || 0,
      totalMembers: membersData.data?.length || 0,
      activeTodos,
      completedTodos,
      upcomingEvents: eventsData.data?.length || 0,
      recentActivity,
    }
  } catch (error) {
    console.error("[Server] Error fetching dashboard data:", error)
    // Return default values on error
    return {
      totalTeams: 0,
      totalMembers: 0,
      activeTodos: 0,
      completedTodos: 0,
      upcomingEvents: 0,
      recentActivity: [],
    }
  }
})

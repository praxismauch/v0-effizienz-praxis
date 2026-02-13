import { createServerClient } from "@/lib/supabase/server"
import { cache } from "react"
import { format, startOfWeek, endOfWeek } from "date-fns"

export interface DienstplanData {
  teamMembers: any[]
  shiftTypes: any[]
  schedules: any[]
  availability: any[]
  swapRequests: any[]
}

/**
 * Get all dienstplan data for a practice and week
 * This is cached per request to avoid duplicate fetches
 */
export const getDienstplanData = cache(async (
  practiceId: string,
  weekStart?: Date
): Promise<DienstplanData> => {
  try {
    const supabase = await createServerClient()
    
    // Calculate week bounds
    const currentWeekStart = weekStart || startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekStartStr = format(currentWeekStart, "yyyy-MM-dd")
    const weekEndStr = format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "yyyy-MM-dd")
    
    // Convert practiceId to number for database queries
    const practiceIdNum = parseInt(practiceId, 10)

    // Fetch all data in parallel
    const [teamMembersResult, shiftTypesResult, schedulesResult, availabilityResult, swapRequestsResult] = await Promise.all([
      // Team members
      supabase
        .from("team_members")
        .select("*")
        .eq("practice_id", practiceIdNum)
        .is("deleted_at", null),
      
      // Shift types
      supabase
        .from("shift_types")
        .select("*")
        .eq("practice_id", practiceIdNum)
        .eq("is_active", true)
        .order("name"),
      
      // Schedules for the week
      supabase
        .from("shift_schedules")
        .select("*")
        .eq("practice_id", practiceIdNum)
        .gte("shift_date", weekStartStr)
        .lte("shift_date", weekEndStr)
        .order("shift_date"),
      
      // Availability
      supabase
        .from("team_availability")
        .select("*")
        .eq("practice_id", practiceIdNum)
        .order("date"),
      
      // Pending swap requests
      supabase
        .from("shift_swap_requests")
        .select("*")
        .eq("practice_id", practiceIdNum)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    ])

    if (teamMembersResult.error?.message) console.error("[Server] Team members error:", teamMembersResult.error.message)
    if (shiftTypesResult.error?.message) console.error("[Server] Shift types error:", shiftTypesResult.error.message)
    if (schedulesResult.error?.message) console.error("[Server] Schedules error:", schedulesResult.error.message)
    if (availabilityResult.error?.message) console.error("[Server] Availability error:", availabilityResult.error.message)
    if (swapRequestsResult.error?.message) console.error("[Server] Swap requests error:", swapRequestsResult.error.message)

    return {
      teamMembers: teamMembersResult.data || [],
      shiftTypes: shiftTypesResult.data || [],
      schedules: schedulesResult.data || [],
      availability: availabilityResult.data || [],
      swapRequests: swapRequestsResult.data || [],
    }
  } catch (error) {
    console.error("[Server] Error fetching dienstplan data:", error)
    return {
      teamMembers: [],
      shiftTypes: [],
      schedules: [],
      availability: [],
      swapRequests: [],
    }
  }
})

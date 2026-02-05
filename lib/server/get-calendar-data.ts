import { createServerClient } from "@/lib/supabase/server"
import { cache } from "react"

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  location?: string
  attendees?: string[]
  practice_id: string
  created_by?: string
  created_at: string
  updated_at?: string
}

/**
 * Get all calendar events for a practice
 */
export const getCalendarEventsByPractice = cache(async (practiceId: string): Promise<CalendarEvent[]> => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("practice_id", practiceId)
      .order("start_time", { ascending: true })

    if (error) {
      console.error("[Server] Error fetching calendar events:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[Server] Error getting calendar events:", error)
    return []
  }
})

/**
 * Get upcoming calendar events for a practice
 */
export const getUpcomingEvents = cache(async (practiceId: string, limit = 10): Promise<CalendarEvent[]> => {
  try {
    const supabase = await createServerClient()
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("practice_id", practiceId)
      .gte("start_time", now)
      .order("start_time", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("[Server] Error fetching upcoming events:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[Server] Error getting upcoming events:", error)
    return []
  }
})

/**
 * Get events for a specific date range
 */
export const getEventsByDateRange = cache(async (
  practiceId: string,
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("practice_id", practiceId)
      .gte("start_time", startDate)
      .lte("start_time", endDate)
      .order("start_time", { ascending: true })

    if (error) {
      console.error("[Server] Error fetching events by date range:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[Server] Error getting events by date range:", error)
    return []
  }
})

/**
 * Get a specific event by ID
 */
export const getEventById = cache(async (eventId: string): Promise<CalendarEvent | null> => {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle()

    if (error) {
      console.error("[Server] Error fetching event:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("[Server] Error getting event:", error)
    return null
  }
})

"use client"

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  type: "meeting" | "training" | "maintenance" | "holiday" | "announcement" | "interview" | "other"
  priority: "low" | "medium" | "high"
  createdBy: string
  createdAt: string
  practiceId: string
  isAllDay: boolean
  attendees?: string[]
  location?: string
  recurrenceType?: "none" | "daily" | "weekly" | "monthly" | "yearly"
  recurrenceEndDate?: string
  isRecurringInstance?: boolean
  parentEventId?: string
  lastGeneratedDate?: string
  interviewType?: string
  interviewStatus?: string
  candidateEmail?: string
  meetingLink?: string
  trainingCourseId?: string
  trainingStatus?: string
  isOnline?: boolean
}

interface CalendarContextType {
  events: CalendarEvent[]
  addEvent: (event: Omit<CalendarEvent, "id" | "createdAt" | "practiceId" | "createdBy">) => void
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
  getEventsByDate: (date: string) => CalendarEvent[]
  getUpcomingEvents: (days?: number) => CalendarEvent[]
  loading: boolean
  refreshEvents: () => Promise<void>
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

function expandRecurringEvents(events: CalendarEvent[], startDate: Date, endDate: Date): CalendarEvent[] {
  const expandedEvents: CalendarEvent[] = []

  for (const event of events) {
    // Add the original event
    expandedEvents.push(event)

    // If it's a recurring event, generate virtual instances
    if (event.recurrenceType && event.recurrenceType !== "none") {
      const eventStart = new Date(event.startDate)
      const recurrenceEnd = event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : endDate

      const currentDate = new Date(eventStart)

      // Move to the first occurrence after the original
      switch (event.recurrenceType) {
        case "daily":
          currentDate.setDate(currentDate.getDate() + 1)
          break
        case "weekly":
          currentDate.setDate(currentDate.getDate() + 7)
          break
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + 1)
          break
        case "yearly":
          currentDate.setFullYear(currentDate.getFullYear() + 1)
          break
      }

      // Generate instances within the view range (max 1 year ahead for performance)
      const maxDate = new Date(Math.min(recurrenceEnd.getTime(), endDate.getTime()))
      let instanceCount = 0
      const MAX_INSTANCES = 365 // Limit to prevent infinite loops

      while (currentDate <= maxDate && instanceCount < MAX_INSTANCES) {
        // Create a virtual instance
        const daysDiff = Math.floor((currentDate.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24))
        const instanceEndDate = new Date(new Date(event.endDate).getTime() + daysDiff * 24 * 60 * 60 * 1000)

        expandedEvents.push({
          ...event,
          id: `${event.id}-instance-${currentDate.toISOString().split("T")[0]}`,
          startDate: currentDate.toISOString().split("T")[0],
          endDate: instanceEndDate.toISOString().split("T")[0],
          isRecurringInstance: true,
          parentEventId: event.id,
        })

        // Move to next occurrence
        switch (event.recurrenceType) {
          case "daily":
            currentDate.setDate(currentDate.getDate() + 1)
            break
          case "weekly":
            currentDate.setDate(currentDate.getDate() + 7)
            break
          case "monthly":
            currentDate.setMonth(currentDate.getMonth() + 1)
            break
          case "yearly":
            currentDate.setFullYear(currentDate.getFullYear() + 1)
            break
        }

        instanceCount++
      }
    }
  }

  return expandedEvents
}

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { currentUser, loading: userLoading } = useUser()

  const loadEvents = async (controller?: AbortController) => {
    if (!currentPractice || !currentUser) {
      setEvents([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const timeoutId = controller ? setTimeout(() => controller.abort(), 10000) : undefined

      const response = await fetch(`/api/practices/${currentPractice.id}/calendar-events`, {
        signal: controller?.signal,
        credentials: "include",
      })

      if (timeoutId) clearTimeout(timeoutId)

      if (!response.ok) {
        setEvents([])
        setIsLoading(false)
        return
      }

      let data
      try {
        const text = await response.text()
        if (!text || text.trim() === "") {
          setEvents([])
          setIsLoading(false)
          return
        }
        data = JSON.parse(text)
      } catch (parseError) {
        setEvents([])
        setIsLoading(false)
        return
      }

      setEvents(data.events || [])
    } catch (error: any) {
      if (error?.name === "AbortError") return
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }

  const refreshEvents = async () => {
    await loadEvents()
  }

  useEffect(() => {
    // Don't fetch until all dependencies are loaded
    if (userLoading || practiceLoading) {
      return
    }

    const controller = new AbortController()
    let isMounted = true

    if (currentPractice && currentUser) {
      loadEvents(controller)
    } else {
      setEvents([])
      setIsLoading(false)
    }

    return () => {
      isMounted = false
      // Only abort if component unmounts, not on dependency changes
      // controller.abort()
    }
  }, [currentPractice, currentUser, userLoading, practiceLoading])

  const addEvent = async (eventData: Omit<CalendarEvent, "id" | "createdAt" | "practiceId" | "createdBy">) => {
    if (!currentPractice || !currentUser) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/calendar-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: eventData.title,
          description: eventData.description,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          type: eventData.type || "meeting",
          priority: eventData.priority || "medium",
          location: eventData.location,
          isAllDay: eventData.isAllDay,
          recurrenceType: eventData.recurrenceType || "none",
          recurrenceEndDate: eventData.recurrenceEndDate || null,
          attendees: eventData.attendees || [],
          createdBy: currentUser.id,
          interviewType: eventData.interviewType,
          interviewStatus: eventData.interviewStatus,
          candidateEmail: eventData.candidateEmail,
          meetingLink: eventData.meetingLink,
          trainingCourseId: eventData.trainingCourseId,
          trainingStatus: eventData.trainingStatus,
          isOnline: eventData.isOnline,
        }),
      })

      if (!response.ok) {
        const responseText = await response.text()
        let errorMessage = "Unbekannter Fehler"
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = responseText || response.statusText || "Serverfehler"
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setEvents((prev) => [...prev, data.event])
    } catch (error) {
      console.error("Error creating calendar event:", error)
      throw error
    }
  }

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    if (!currentPractice) return

    try {
      let realEventId = id
      if (id.includes("-instance-")) {
        realEventId = id.split("-instance-")[0]
      }

      const response = await fetch(`/api/practices/${currentPractice.id}/calendar-events/${realEventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          recurrenceType: updates.recurrenceType || "none",
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update event: ${response.statusText}`)
      }

      const data = await response.json()
      setEvents((prev) => prev.map((event) => (event.id === realEventId ? data.event : event)))
    } catch (error) {
      console.error("Error updating calendar event:", error)
      throw error
    }
  }

  const deleteEvent = async (id: string) => {
    if (!currentPractice) return

    try {
      let realEventId = id
      if (id.includes("-instance-")) {
        realEventId = id.split("-instance-")[0]
      }

      const response = await fetch(`/api/practices/${currentPractice.id}/calendar-events/${realEventId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.statusText}`)
      }

      setEvents((prev) => prev.filter((event) => event.id !== realEventId))
    } catch (error) {
      console.error("Error deleting calendar event:", error)
      throw error
    }
  }

  const getEventsByDate = (date: string) => {
    if (!currentPractice) return []

    const targetDate = new Date(date)
    const rangeStart = new Date(targetDate)
    rangeStart.setMonth(rangeStart.getMonth() - 3)
    const rangeEnd = new Date(targetDate)
    rangeEnd.setMonth(rangeEnd.getMonth() + 3)

    const practiceEvents = events.filter((event) => event.practiceId === currentPractice.id)
    const expandedEvents = expandRecurringEvents(practiceEvents, rangeStart, rangeEnd)

    return expandedEvents.filter((event) => event.startDate <= date && event.endDate >= date)
  }

  const getUpcomingEvents = (days = 7) => {
    if (!currentPractice) return []
    const today = new Date()
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)

    const practiceEvents = events.filter((event) => event.practiceId === currentPractice.id)
    const expandedEvents = expandRecurringEvents(practiceEvents, today, futureDate)

    return expandedEvents
      .filter((event) => new Date(event.startDate) >= today && new Date(event.startDate) <= futureDate)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  }

  // Filter events by current practice
  const practiceEvents = currentPractice ? events.filter((event) => event.practiceId === currentPractice.id) : []

  // This ensures calendar views show all recurring instances
  const expandedPracticeEvents = useMemo(() => {
    if (practiceEvents.length === 0) return []

    // Expand for a 2-year range (1 year back, 1 year forward)
    const now = new Date()
    const rangeStart = new Date(now)
    rangeStart.setFullYear(rangeStart.getFullYear() - 1)
    const rangeEnd = new Date(now)
    rangeEnd.setFullYear(rangeEnd.getFullYear() + 1)

    return expandRecurringEvents(practiceEvents, rangeStart, rangeEnd)
  }, [practiceEvents])

  return (
    <CalendarContext.Provider
      value={{
        events: expandedPracticeEvents,
        addEvent,
        updateEvent,
        deleteEvent,
        getEventsByDate,
        getUpcomingEvents,
        loading: isLoading,
        refreshEvents,
      }}
    >
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendar() {
  const context = useContext(CalendarContext)
  if (context === undefined) {
    throw new Error("useCalendar must be used within a CalendarProvider")
  }
  return context
}

export default CalendarProvider

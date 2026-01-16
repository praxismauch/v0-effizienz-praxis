"use client"

import { createContext, useContext, useMemo, useCallback, type ReactNode } from "react"
import useSWR from "swr"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { SWR_KEYS, DEFAULT_PRACTICE_ID } from "@/lib/swr-keys"
import { swrFetcher, mutationFetcher } from "@/lib/swr-fetcher"

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
    expandedEvents.push(event)

    if (event.recurrenceType && event.recurrenceType !== "none") {
      const eventStart = new Date(event.startDate)
      const recurrenceEnd = event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : endDate

      const currentDate = new Date(eventStart)

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

      const maxDate = new Date(Math.min(recurrenceEnd.getTime(), endDate.getTime()))
      let instanceCount = 0
      const MAX_INSTANCES = 365

      while (currentDate <= maxDate && instanceCount < MAX_INSTANCES) {
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
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { currentUser, loading: userLoading } = useUser()

  const practiceId = currentPractice?.id || DEFAULT_PRACTICE_ID

  const { data, isLoading, mutate } = useSWR<{ events: CalendarEvent[] }>(
    !userLoading && !practiceLoading && currentUser && currentPractice ? SWR_KEYS.calendarEvents(practiceId) : null,
    swrFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    },
  )

  const rawEvents = data?.events || []

  const refreshEvents = useCallback(async () => {
    await mutate()
  }, [mutate])

  const addEvent = useCallback(
    async (eventData: Omit<CalendarEvent, "id" | "createdAt" | "practiceId" | "createdBy">) => {
      if (!currentPractice || !currentUser) return

      try {
        const result = await mutationFetcher<{ event: CalendarEvent }>(SWR_KEYS.calendarEvents(practiceId), {
          method: "POST",
          body: {
            ...eventData,
            createdBy: currentUser.id,
          },
        })

        await mutate(
          (current) => ({
            events: [...(current?.events || []), result.event],
          }),
          { revalidate: false },
        )
      } catch (error) {
        console.error("Error creating calendar event:", error)
        throw error
      }
    },
    [currentPractice, currentUser, practiceId, mutate],
  )

  const updateEvent = useCallback(
    async (id: string, updates: Partial<CalendarEvent>) => {
      if (!currentPractice) return

      let realEventId = id
      if (id.includes("-instance-")) {
        realEventId = id.split("-instance-")[0]
      }

      await mutate(
        (current) => ({
          events: (current?.events || []).map((event) => (event.id === realEventId ? { ...event, ...updates } : event)),
        }),
        { revalidate: false },
      )

      try {
        await mutationFetcher(`${SWR_KEYS.calendarEvents(practiceId)}/${realEventId}`, {
          method: "PUT",
          body: { ...updates, recurrenceType: updates.recurrenceType || "none" },
        })
        await mutate()
      } catch (error) {
        await mutate()
        console.error("Error updating calendar event:", error)
        throw error
      }
    },
    [currentPractice, practiceId, mutate],
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      if (!currentPractice) return

      let realEventId = id
      if (id.includes("-instance-")) {
        realEventId = id.split("-instance-")[0]
      }

      await mutate(
        (current) => ({
          events: (current?.events || []).filter((event) => event.id !== realEventId),
        }),
        { revalidate: false },
      )

      try {
        await mutationFetcher(`${SWR_KEYS.calendarEvents(practiceId)}/${realEventId}`, {
          method: "DELETE",
        })
      } catch (error) {
        await mutate()
        console.error("Error deleting calendar event:", error)
        throw error
      }
    },
    [currentPractice, practiceId, mutate],
  )

  // Filter and expand events
  const practiceEvents = currentPractice ? rawEvents.filter((event) => event.practiceId === currentPractice.id) : []

  const expandedPracticeEvents = useMemo(() => {
    if (practiceEvents.length === 0) return []

    const now = new Date()
    const rangeStart = new Date(now)
    rangeStart.setFullYear(rangeStart.getFullYear() - 1)
    const rangeEnd = new Date(now)
    rangeEnd.setFullYear(rangeEnd.getFullYear() + 1)

    return expandRecurringEvents(practiceEvents, rangeStart, rangeEnd)
  }, [practiceEvents])

  const getEventsByDate = useCallback(
    (date: string) => {
      if (!currentPractice) return []

      const targetDate = new Date(date)
      const rangeStart = new Date(targetDate)
      rangeStart.setMonth(rangeStart.getMonth() - 3)
      const rangeEnd = new Date(targetDate)
      rangeEnd.setMonth(rangeEnd.getMonth() + 3)

      const expanded = expandRecurringEvents(practiceEvents, rangeStart, rangeEnd)
      return expanded.filter((event) => event.startDate <= date && event.endDate >= date)
    },
    [currentPractice, practiceEvents],
  )

  const getUpcomingEvents = useCallback(
    (days = 7) => {
      if (!currentPractice) return []
      const today = new Date()
      const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)

      const expanded = expandRecurringEvents(practiceEvents, today, futureDate)

      return expanded
        .filter((event) => new Date(event.startDate) >= today && new Date(event.startDate) <= futureDate)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    },
    [currentPractice, practiceEvents],
  )

  const contextValue = useMemo(
    () => ({
      events: expandedPracticeEvents,
      addEvent,
      updateEvent,
      deleteEvent,
      getEventsByDate,
      getUpcomingEvents,
      loading: userLoading || practiceLoading || isLoading,
      refreshEvents,
    }),
    [
      expandedPracticeEvents,
      addEvent,
      updateEvent,
      deleteEvent,
      getEventsByDate,
      getUpcomingEvents,
      userLoading,
      practiceLoading,
      isLoading,
      refreshEvents,
    ],
  )

  return <CalendarContext.Provider value={contextValue}>{children}</CalendarContext.Provider>
}

export function useCalendar() {
  const context = useContext(CalendarContext)
  if (context === undefined) {
    throw new Error("useCalendar must be used within a CalendarProvider")
  }
  return context
}

export default CalendarProvider

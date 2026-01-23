"use client"

import { useState, useMemo, useCallback } from "react"
import useSWR from "swr"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  format,
} from "date-fns"
import { de } from "date-fns/locale"
import type { CalendarEvent, CalendarView } from "../types"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((res) => res.json())

export function useCalendar(practiceId: string | undefined) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>("month")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Fetch events
  const { data: eventsData, mutate: mutateEvents } = useSWR<{ events: CalendarEvent[] }>(
    practiceId ? `/api/practices/${practiceId}/calendar/events` : null,
    fetcher
  )

  const events = eventsData?.events || []

  // Navigation
  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  const goToPrevious = useCallback(() => {
    switch (view) {
      case "month":
        setCurrentDate((d) => subMonths(d, 1))
        break
      case "week":
        setCurrentDate((d) => subWeeks(d, 1))
        break
      case "day":
        setCurrentDate((d) => subDays(d, 1))
        break
    }
  }, [view])

  const goToNext = useCallback(() => {
    switch (view) {
      case "month":
        setCurrentDate((d) => addMonths(d, 1))
        break
      case "week":
        setCurrentDate((d) => addWeeks(d, 1))
        break
      case "day":
        setCurrentDate((d) => addDays(d, 1))
        break
    }
  }, [view])

  // Date range for current view
  const dateRange = useMemo(() => {
    switch (view) {
      case "month":
        return {
          start: startOfWeek(startOfMonth(currentDate), { locale: de }),
          end: endOfWeek(endOfMonth(currentDate), { locale: de }),
        }
      case "week":
        return {
          start: startOfWeek(currentDate, { locale: de }),
          end: endOfWeek(currentDate, { locale: de }),
        }
      case "day":
        return {
          start: currentDate,
          end: currentDate,
        }
    }
  }, [currentDate, view])

  // Title for current view
  const title = useMemo(() => {
    switch (view) {
      case "month":
        return format(currentDate, "MMMM yyyy", { locale: de })
      case "week":
        const weekStart = startOfWeek(currentDate, { locale: de })
        const weekEnd = endOfWeek(currentDate, { locale: de })
        return `${format(weekStart, "d. MMM", { locale: de })} - ${format(weekEnd, "d. MMM yyyy", { locale: de })}`
      case "day":
        return format(currentDate, "EEEE, d. MMMM yyyy", { locale: de })
    }
  }, [currentDate, view])

  // Filter events for current view
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_time)
      return eventDate >= dateRange.start && eventDate <= dateRange.end
    })
  }, [events, dateRange])

  return {
    currentDate,
    setCurrentDate,
    view,
    setView,
    selectedDate,
    setSelectedDate,
    events,
    filteredEvents,
    mutateEvents,
    goToToday,
    goToPrevious,
    goToNext,
    title,
    dateRange,
  }
}

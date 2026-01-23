"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, addWeeks, addDays, isSameMonth, isSameDay, isToday } from "date-fns"
import { de } from "date-fns/locale"
import { Plus, ChevronLeft, ChevronRight, Grid3X3, CalendarPlusIcon as CalendarLucide, Clock, Sparkles } from "lucide-react"
import useSWR from "swr"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { usePractice } from "@/contexts/practice-context"
import { useCurrentUser } from "@/hooks/use-current-user"

import type { CalendarEvent } from "./types"
import { MonthView } from "./components/month-view"
import { WeekView } from "./components/week-view"
import { DayView } from "./components/day-view"
import { EventList } from "./components/event-list"
import { EventDialog } from "./components/event-dialog"
import { CalendarMenuBar } from "@/components/calendar-menu-bar"
import { AICalendarDialog } from "@/components/ai-calendar-dialog"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((res) => res.json())

export default function CalendarPageClient() {
  const { currentPractice } = usePractice()
  const { user, loading: userLoading } = useCurrentUser()
  const practiceId = currentPractice?.id?.toString()

  // View state
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("calendar-view-mode")
      if (saved === "month" || saved === "week" || saved === "day") return saved
    }
    return "month"
  })
  const [activeTab, setActiveTab] = useState("calendar")
  const [currentDate, setCurrentDate] = useState(new Date())

  // Filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>("date-asc")

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Persist view mode
  useEffect(() => {
    localStorage.setItem("calendar-view-mode", viewMode)
  }, [viewMode])

  // Fetch events
  const { data: eventsData, mutate: refreshEvents, isLoading } = useSWR(
    practiceId ? `/api/practices/${practiceId}/calendar` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const events: CalendarEvent[] = eventsData?.events || []
  const loading = userLoading || isLoading

  // Navigation
  const navigatePrevious = useCallback(() => {
    switch (viewMode) {
      case "month": setCurrentDate((d) => addMonths(d, -1)); break
      case "week": setCurrentDate((d) => addWeeks(d, -1)); break
      case "day": setCurrentDate((d) => addDays(d, -1)); break
    }
  }, [viewMode])

  const navigateNext = useCallback(() => {
    switch (viewMode) {
      case "month": setCurrentDate((d) => addMonths(d, 1)); break
      case "week": setCurrentDate((d) => addWeeks(d, 1)); break
      case "day": setCurrentDate((d) => addDays(d, 1)); break
    }
  }, [viewMode])

  const goToToday = useCallback(() => setCurrentDate(new Date()), [])

  // Calendar data
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [currentDate])

  // Event helpers
  const getEventsForDay = useCallback((day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd")
    return events.filter((event) => event.startDate === dayStr)
  }, [events])

  const getEventsForHour = useCallback((day: Date, hour: number) => {
    const dayStr = format(day, "yyyy-MM-dd")
    return events.filter((event) => {
      if (event.startDate !== dayStr || event.isAllDay) return false
      const eventHour = Number.parseInt(event.startTime.split(":")[0], 10)
      return eventHour === hour
    })
  }, [events])

  const getAllDayEventsForDay = useCallback((day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd")
    return events.filter((event) => event.startDate === dayStr && event.isAllDay)
  }, [events])

  // Filtered events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events]
    if (searchTerm) {
      filtered = filtered.filter((e) =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((e) => selectedTypes.includes(e.type))
    }
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter((e) => selectedPriorities.includes(e.priority))
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-asc": return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        case "date-desc": return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        case "title-asc": return a.title.localeCompare(b.title)
        case "title-desc": return b.title.localeCompare(a.title)
        default: return 0
      }
    })
    return filtered
  }, [events, searchTerm, selectedTypes, selectedPriorities, sortBy])

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    const sevenDaysLater = addDays(now, 7)
    return filteredAndSortedEvents.filter((e) => {
      const eventDate = new Date(e.startDate)
      return eventDate >= now && eventDate <= sevenDaysLater
    })
  }, [filteredAndSortedEvents])

  const getViewTitle = () => {
    switch (viewMode) {
      case "month": return format(currentDate, "MMMM yyyy", { locale: de })
      case "week":
        const ws = startOfWeek(currentDate, { weekStartsOn: 1 })
        const we = endOfWeek(currentDate, { weekStartsOn: 1 })
        return `${format(ws, "dd.MM.", { locale: de })} - ${format(we, "dd.MM.yyyy", { locale: de })}`
      case "day": return format(currentDate, "EEEE, dd. MMMM yyyy", { locale: de })
    }
  }

  // Handlers
  const handleDayClick = (day: Date) => {
    setSelectedDate(day)
    setShowCreateDialog(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }

  const handleEventSaved = () => {
    refreshEvents()
    setShowCreateDialog(false)
    setSelectedEvent(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px]" />
        <p className="text-center text-muted-foreground">Kalender wird geladen...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-muted-foreground">Bitte melden Sie sich an</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Kalender</h1>
          <p className="text-muted-foreground">Gemeinsamer Kalender für {currentPractice?.name || "Ihre Praxis"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" className="bg-purple-500 hover:bg-purple-600" onClick={() => setShowAIDialog(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            KI-Terminassistent
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Termin hinzufügen
          </Button>
        </div>
      </div>

      {/* Menu Bar */}
      <CalendarMenuBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        selectedPriorities={selectedPriorities}
        onPrioritiesChange={setSelectedPriorities}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={(mode) => setViewMode(mode as "month" | "week" | "day")}
        onRefresh={() => refreshEvents()}
        totalEvents={events.length}
        filteredEvents={filteredAndSortedEvents.length}
        events={filteredAndSortedEvents}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Kalender-Ansicht</TabsTrigger>
          <TabsTrigger value="upcoming">Kommende Termine</TabsTrigger>
          <TabsTrigger value="all">Alle Termine</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          {/* View Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>Heute</Button>
              <Button variant="outline" size="sm" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold ml-4 capitalize">{getViewTitle()}</h2>
            </div>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button variant={viewMode === "month" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("month")} className="gap-2">
                <Grid3X3 className="h-4 w-4" />Monat
              </Button>
              <Button variant={viewMode === "week" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("week")} className="gap-2">
                <CalendarLucide className="h-4 w-4" />Woche
              </Button>
              <Button variant={viewMode === "day" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("day")} className="gap-2">
                <Clock className="h-4 w-4" />Tag
              </Button>
            </div>
          </div>

          {/* Calendar Views */}
          {viewMode === "month" && (
            <MonthView
              monthDays={monthDays}
              currentDate={currentDate}
              getEventsForDay={getEventsForDay}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
            />
          )}
          {viewMode === "week" && (
            <WeekView
              weekDays={weekDays}
              getEventsForHour={getEventsForHour}
              getAllDayEventsForDay={getAllDayEventsForDay}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
            />
          )}
          {viewMode === "day" && (
            <DayView
              currentDate={currentDate}
              getEventsForHour={getEventsForHour}
              getAllDayEventsForDay={getAllDayEventsForDay}
              onEventClick={handleEventClick}
            />
          )}
        </TabsContent>

        <TabsContent value="upcoming">
          <EventList
            events={upcomingEvents}
            title="Kommende Termine (nächste 7 Tage)"
            emptyMessage="Keine kommenden Termine"
            onEventClick={handleEventClick}
          />
        </TabsContent>

        <TabsContent value="all">
          <EventList
            events={filteredAndSortedEvents}
            title="Alle Termine"
            emptyMessage="Keine Termine gefunden"
            onEventClick={handleEventClick}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        practiceId={practiceId}
        initialDate={selectedDate}
        onSaved={handleEventSaved}
      />

      <EventDialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
        practiceId={practiceId}
        event={selectedEvent}
        onSaved={handleEventSaved}
      />

      <AICalendarDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        practiceId={practiceId}
        onEventCreated={handleEventSaved}
      />
    </div>
  )
}

"use client"
import { useState, useMemo, useCallback } from "react"
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns"
import { de } from "date-fns/locale"
import CalendarMenuBar from "@/components/calendar-menu-bar"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useCalendar, type CalendarEvent as OriginalCalendarEvent } from "@/contexts/calendar-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Clock,
  MapPin,
  Sparkles,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CalendarPlusIcon as CalendarLucide,
  LayoutList,
  Grid3X3,
  Loader2,
  Repeat,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast" // Import toast
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type CalendarEvent = {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  type: "meeting" | "training" | "maintenance" | "holiday" | "announcement" | "task" | "event" | "interview" | "other"
  priority: "low" | "medium" | "high"
  location?: string
  isAllDay: boolean
  recurrence?: string
  isRecurringInstance?: boolean
  interviewType?: string
  interviewStatus?: string
  candidateEmail?: string
  meetingLink?: string
  trainingCourseId?: string
  trainingStatus?: string
  isOnline?: boolean
}

// Helper function to parse dates safely
function safeParseDate(dateValue: string | Date | null | undefined): Date | null {
  if (!dateValue) return null
  try {
    const date = typeof dateValue === "string" ? parseISO(dateValue) : dateValue
    return date
  } catch {
    return null
  }
}

// Function to get event type color
const getEventTypeColor = (type: string) => {
  switch (type) {
    case "meeting":
      return "bg-blue-500"
    case "interview":
      return "bg-emerald-500"
    case "task":
      return "bg-orange-500"
    case "event":
      return "bg-purple-500"
    case "training":
      return "bg-yellow-500"
    case "maintenance":
      return "bg-red-500"
    case "holiday":
      return "bg-indigo-500"
    case "announcement":
      return "bg-pink-500"
    default:
      return "bg-gray-500"
  }
}

const getEventTypeLabel = (type: string) => {
  const labels: Record<string, { label: string; bgColor: string; textColor: string }> = {
    meeting: { label: "Meeting", bgColor: "bg-blue-100", textColor: "text-blue-700" },
    appointment: { label: "Termin", bgColor: "bg-green-100", textColor: "text-green-700" },
    task: { label: "Aufgabe", bgColor: "bg-orange-100", textColor: "text-orange-700" },
    event: { label: "Event", bgColor: "bg-purple-100", textColor: "text-purple-700" },
    interview: { label: "Vorstellungsgespräch", bgColor: "bg-emerald-100", textColor: "text-emerald-700" },
    training: { label: "Fortbildung", bgColor: "bg-yellow-100", textColor: "text-yellow-700" },
    maintenance: { label: "Wartung", bgColor: "bg-red-100", textColor: "text-red-700" },
    holiday: { label: "Feiertag", bgColor: "bg-indigo-100", textColor: "text-indigo-700" },
    announcement: { label: "Ankündigung", bgColor: "bg-pink-100", textColor: "text-pink-700" },
    other: { label: "Sonstiges", bgColor: "bg-gray-100", textColor: "text-gray-700" },
  }
  return labels[type] || labels.other
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function CalendarPageClient() {
  const { currentUser: user, loading: authLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const {
    events: originalEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    loading: calendarLoading,
    refreshEvents,
  } = useCalendar()

  const loading = authLoading || practiceLoading || calendarLoading

  // Map original events to the new CalendarEvent type and remove duplicates by ID
  const events: CalendarEvent[] = useMemo(() => {
    const eventMap = new Map<string, CalendarEvent>()

    originalEvents.forEach((event: OriginalCalendarEvent) => {
      if (!eventMap.has(event.id)) {
        eventMap.set(event.id, {
          id: event.id,
          title: event.title,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          type: (event.type as CalendarEvent["type"]) || "other",
          priority: event.priority || "medium",
          location: event.location,
          isAllDay: event.isAllDay || false,
          recurrence: event.recurrenceType,
          isRecurringInstance: event.isRecurringInstance || (event.recurrenceType && event.recurrenceType !== "none"),
          // Initialize new fields
          interviewType: event.interviewType,
          interviewStatus: event.interviewStatus,
          candidateEmail: event.candidateEmail,
          meetingLink: event.meetingLink,
          trainingCourseId: event.trainingCourseId,
          trainingStatus: event.trainingStatus,
          isOnline: event.isOnline,
        })
      }
    })

    return Array.from(eventMap.values())
  }, [originalEvents])

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [aiPrompt, setAiPrompt] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>("date-asc")
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month")
  const [activeTab, setActiveTab] = useState<string>("calendar")

  // State for the form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "10:00",
    type: "meeting" as const,
    priority: "medium" as const,
    location: "",
    isAllDay: false,
    recurrence: "none",
    // Initialize new fields
    interviewType: "",
    interviewStatus: "scheduled",
    candidateEmail: "",
    meetingLink: "",
    trainingCourseId: "",
    trainingStatus: "upcoming",
    isOnline: false,
  })

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "10:00",
      type: "meeting",
      priority: "medium",
      location: "",
      isAllDay: false,
      recurrence: "none",
      // Reset new fields
      interviewType: "",
      interviewStatus: "scheduled",
      candidateEmail: "",
      meetingLink: "",
      trainingCourseId: "",
      trainingStatus: "upcoming",
      isOnline: false,
    })
  }

  // Handler for creating a new event
  const handleCreateEvent = async () => {
    try {
      await addEvent({
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        type: formData.type,
        priority: formData.priority,
        location: formData.location,
        isAllDay: formData.isAllDay,
        recurrenceType: formData.recurrence as "none" | "daily" | "weekly" | "monthly" | "yearly",
        attendees: [],
        // Pass new fields
        interviewType: formData.type === "interview" ? formData.interviewType : undefined,
        interviewStatus: formData.type === "interview" ? formData.interviewStatus : undefined,
        candidateEmail: formData.type === "interview" ? formData.candidateEmail : undefined,
        meetingLink: formData.type === "meeting" || formData.type === "interview" ? formData.meetingLink : undefined,
        trainingCourseId: formData.type === "training" ? formData.trainingCourseId : undefined,
        trainingStatus: formData.type === "training" ? formData.trainingStatus : undefined,
        isOnline: formData.type === "meeting" || formData.type === "interview" ? formData.isOnline : undefined,
      })
      setShowCreateDialog(false)
      resetForm()
      refreshEvents() // Refresh events after creation
    } catch (error) {
      console.error("Failed to create event:", error)
      alert("Fehler beim Erstellen des Termins. Bitte versuchen Sie es erneut.")
    }
  }

  // Handler for updating an existing event
  const handleUpdateEvent = async () => {
    if (!selectedEvent) {
      toast({
        title: "Fehler",
        description: "Kein Event ausgewählt. Bitte Seite neu laden.",
        variant: "destructive",
      })
      return
    }
    try {
      await updateEvent(selectedEvent.id, {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        type: formData.type,
        priority: formData.priority,
        location: formData.location,
        isAllDay: formData.isAllDay,
        recurrenceType: formData.recurrence as "none" | "daily" | "weekly" | "monthly" | "yearly",
        // Pass new fields
        interviewType: formData.type === "interview" ? formData.interviewType : undefined,
        interviewStatus: formData.type === "interview" ? formData.interviewStatus : undefined,
        candidateEmail: formData.type === "interview" ? formData.candidateEmail : undefined,
        meetingLink: formData.type === "meeting" || formData.type === "interview" ? formData.meetingLink : undefined,
        trainingCourseId: formData.type === "training" ? formData.trainingCourseId : undefined,
        trainingStatus: formData.type === "training" ? formData.trainingStatus : undefined,
        isOnline: formData.type === "meeting" || formData.type === "interview" ? formData.isOnline : undefined,
      })
      setShowEditDialog(false)
      setSelectedEvent(null)
      resetForm()
      refreshEvents() // Refresh events after update
    } catch (error) {
      console.error("Failed to update event:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren des Termins. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) {
      toast({
        title: "Fehler",
        description: "Kein Event ausgewählt. Bitte Seite neu laden.",
        variant: "destructive",
      })
      return
    }

    try {
      await deleteEvent(selectedEvent.id)
      setShowEditDialog(false)
      setShowDeleteDialog(false)
      setSelectedEvent(null)
      resetForm()
      refreshEvents()
    } catch (error) {
      console.error("Failed to delete event:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen des Termins. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    }
  }

  // Function to open the edit dialog and pre-fill the form
  const openEditDialog = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setFormData({
      title: event.title,
      description: event.description || "",
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      type: event.type,
      priority: event.priority,
      location: event.location || "",
      isAllDay: event.isAllDay,
      recurrence: event.recurrence || "none",
      // Pre-fill new fields
      interviewType: event.interviewType || "",
      interviewStatus: event.interviewStatus || "scheduled",
      candidateEmail: event.candidateEmail || "",
      meetingLink: event.meetingLink || "",
      trainingCourseId: event.trainingCourseId || "",
      trainingStatus: event.trainingStatus || "upcoming",
      isOnline: event.isOnline || false,
    })
    setShowEditDialog(true)
  }

  const navigatePrevious = () => {
    switch (viewMode) {
      case "month":
        setCurrentDate(subMonths(currentDate, 1))
        break
      case "week":
        setCurrentDate(subWeeks(currentDate, 1))
        break
      case "day":
        setCurrentDate(subDays(currentDate, 1))
        break
    }
  }

  const navigateNext = () => {
    switch (viewMode) {
      case "month":
        setCurrentDate(addMonths(currentDate, 1))
        break
      case "week":
        setCurrentDate(addWeeks(currentDate, 1))
        break
      case "day":
        setCurrentDate(addDays(currentDate, 1))
        break
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days = []
    let day = startDate
    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [currentDate])

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i))
    }
    return days
  }, [currentDate])

  // Get events for a specific day
  const getEventsForDay = useCallback(
    (day: Date) => {
      const dayStr = format(day, "yyyy-MM-dd")
      return events.filter((event) => event.startDate === dayStr)
    },
    [events],
  )

  const getEventsForHour = useCallback(
    (day: Date, hour: number) => {
      const dayStr = format(day, "yyyy-MM-dd")
      return events.filter((event) => {
        if (event.startDate !== dayStr) return false
        if (event.isAllDay) return false
        const eventHour = Number.parseInt(event.startTime.split(":")[0], 10)
        return eventHour === hour
      })
    },
    [events],
  )

  const getAllDayEventsForDay = useCallback(
    (day: Date) => {
      const dayStr = format(day, "yyyy-MM-dd")
      return events.filter((event) => event.startDate === dayStr && event.isAllDay)
    },
    [events],
  )

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events]

    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter((event) => selectedTypes.includes(event.type))
    }

    if (selectedPriorities.length > 0) {
      filtered = filtered.filter((event) => selectedPriorities.includes(event.priority))
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        case "date-desc":
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        case "title-asc":
          return a.title.localeCompare(b.title)
        case "title-desc":
          return b.title.localeCompare(a.title)
        case "priority-high":
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case "priority-low":
          const priorityOrderLow = { high: 3, medium: 2, low: 1 }
          return priorityOrderLow[a.priority] - priorityOrderLow[b.priority]
        default:
          return 0
      }
    })

    return filtered
  }, [events, searchTerm, selectedTypes, selectedPriorities, sortBy])

  // Calculate upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const now = new Date()
    const sevenDaysLater = addDays(now, 7)
    return filteredAndSortedEvents.filter((event) => {
      const eventDate = new Date(event.startDate)
      return eventDate >= now && eventDate <= sevenDaysLater
    })
  }, [filteredAndSortedEvents])

  const getViewTitle = () => {
    switch (viewMode) {
      case "month":
        return format(currentDate, "MMMM yyyy", { locale: de })
      case "week":
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
        return `${format(weekStart, "dd.MM.", { locale: de })} - ${format(weekEnd, "dd.MM.yyyy", { locale: de })}`
      case "day":
        return format(currentDate, "EEEE, dd. MMMM yyyy", { locale: de })
    }
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

      <div className="flex items-center gap-4">
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="calendar">Kalender-Ansicht</TabsTrigger>
          <TabsTrigger value="upcoming">Kommende Termine</TabsTrigger>
          <TabsTrigger value="all">Alle Termine</TabsTrigger>
        </TabsList>

        {/* Calendar View Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Heute
              </Button>
              <Button variant="outline" size="sm" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold ml-4 capitalize">{getViewTitle()}</h2>
            </div>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("month")}
                className="gap-2"
              >
                <Grid3X3 className="h-4 w-4" />
                Monat
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("week")}
                className="gap-2"
              >
                <CalendarLucide className="h-4 w-4" />
                Woche
              </Button>
              <Button
                variant={viewMode === "day" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("day")}
                className="gap-2"
              >
                <LayoutList className="h-4 w-4" />
                Tag
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Calendar Grid */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                {viewMode === "month" && (
                  <>
                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {/* Weekday headers */}
                      {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
                        <div key={day} className="text-center font-medium text-muted-foreground py-2 text-sm">
                          {day}
                        </div>
                      ))}

                      {/* Calendar days */}
                      {calendarDays.map((day) => {
                        const dayEvents = getEventsForDay(day)
                        const isCurrentMonth = isSameMonth(day, currentDate)
                        const isSelected = selectedDate && isSameDay(day, selectedDate)
                        const isTodayDate = isToday(day)

                        return (
                          <button
                            key={day.toISOString()}
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                              "min-h-[80px] p-2 rounded-lg border text-left transition-all",
                              isCurrentMonth ? "bg-card" : "bg-muted/30 text-muted-foreground",
                              isSelected && "ring-2 ring-blue-500 border-blue-500",
                              isTodayDate && !isSelected && "border-blue-300",
                              "hover:bg-accent",
                            )}
                          >
                            <div
                              className={cn(
                                "text-sm font-medium mb-1",
                                !isCurrentMonth && "text-muted-foreground",
                                isTodayDate && "font-bold",
                              )}
                            >
                              {format(day, "d")}
                            </div>
                            <div className="space-y-0.5">
                              {/* Month view - event display with recurrence indicator */}
                              {dayEvents.slice(0, 2).map((event) => (
                                <div
                                  key={event.id}
                                  className={cn(
                                    "text-xs px-1 py-0.5 rounded text-white truncate flex items-center gap-1",
                                    getEventTypeColor(event.type),
                                  )}
                                  title={event.title}
                                >
                                  {event.recurrence && event.recurrence !== "none" && (
                                    <Repeat className="h-2.5 w-2.5 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{event.title}</span>
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <div className="text-xs text-muted-foreground pl-1">+{dayEvents.length - 2} mehr</div>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}

                {viewMode === "week" && (
                  <div className="overflow-hidden">
                    {/* Week header */}
                    <div className="grid grid-cols-8 border-b">
                      <div className="p-2 text-center text-sm font-medium text-muted-foreground border-r">Zeit</div>
                      {weekDays.map((day) => (
                        <button
                          key={day.toISOString()}
                          onClick={() => {
                            setSelectedDate(day)
                            setCurrentDate(day)
                          }}
                          className={cn(
                            "p-2 text-center border-r last:border-r-0 hover:bg-accent transition-colors",
                            isToday(day) && "bg-blue-50 dark:bg-blue-950/20",
                            selectedDate && isSameDay(day, selectedDate) && "ring-2 ring-inset ring-blue-500",
                          )}
                        >
                          <div className="text-sm font-medium">{format(day, "EEE", { locale: de })}</div>
                          <div className={cn("text-lg", isToday(day) && "font-bold text-blue-600")}>
                            {format(day, "d")}
                          </div>
                          {/* All-day events */}
                          {getAllDayEventsForDay(day).length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {getAllDayEventsForDay(day)
                                .slice(0, 2)
                                .map((event) => (
                                  <div
                                    key={event.id}
                                    className={cn(
                                      "text-xs px-1 rounded text-white truncate",
                                      getEventTypeColor(event.type),
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openEditDialog(event)
                                    }}
                                  >
                                    {event.title}
                                  </div>
                                ))}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Time slots */}
                    <ScrollArea className="h-[500px]">
                      <div className="grid grid-cols-8">
                        {HOURS.slice(6, 22).map((hour) => (
                          <div key={hour} className="contents">
                            <div className="p-2 text-xs text-muted-foreground border-r border-b text-right pr-3">
                              {hour.toString().padStart(2, "0")}:00
                            </div>
                            {weekDays.map((day) => {
                              const hourEvents = getEventsForHour(day, hour)
                              return (
                                <div
                                  key={`${day.toISOString()}-${hour}`}
                                  className={cn(
                                    "min-h-[50px] border-r border-b last:border-r-0 p-1 hover:bg-accent/50 transition-colors cursor-pointer",
                                    isToday(day) && "bg-blue-50/50 dark:bg-blue-950/10",
                                  )}
                                  onClick={() => {
                                    setSelectedDate(day)
                                    setFormData({
                                      ...formData,
                                      startDate: format(day, "yyyy-MM-dd"),
                                      endDate: format(day, "yyyy-MM-dd"),
                                      startTime: `${hour.toString().padStart(2, "0")}:00`,
                                      endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
                                    })
                                    setShowCreateDialog(true)
                                  }}
                                >
                                  {/* Week view - event display with recurrence indicator */}
                                  {hourEvents.map((event) => (
                                    <div
                                      key={event.id}
                                      className={cn(
                                        "text-xs px-1 py-0.5 rounded text-white truncate mb-0.5 cursor-pointer flex items-center gap-1",
                                        getEventTypeColor(event.type),
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openEditDialog(event)
                                      }}
                                    >
                                      {event.recurrence && event.recurrence !== "none" && (
                                        <Repeat className="h-2.5 w-2.5 flex-shrink-0" />
                                      )}
                                      <span className="truncate">
                                        {event.startTime} {event.title}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {viewMode === "day" && (
                  <div className="overflow-hidden">
                    {/* Day header */}
                    <div className="border-b p-4 text-center">
                      <div className={cn("text-2xl font-bold", isToday(currentDate) && "text-blue-600")}>
                        {format(currentDate, "dd. MMMM yyyy", { locale: de })}
                      </div>
                      <div className="text-muted-foreground">{format(currentDate, "EEEE", { locale: de })}</div>
                      {/* All-day events */}
                      {getAllDayEventsForDay(currentDate).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 justify-center">
                          {getAllDayEventsForDay(currentDate).map((event) => (
                            <Badge
                              key={event.id}
                              className={cn(
                                "cursor-pointer flex items-center gap-1",
                                getEventTypeColor(event.type),
                                "text-white",
                              )}
                              onClick={() => openEditDialog(event)}
                            >
                              {event.recurrence && event.recurrence !== "none" && <Repeat className="h-3 w-3" />}
                              Ganztägig: {event.title}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Time slots */}
                    <ScrollArea className="h-[500px]">
                      <div className="divide-y">
                        {HOURS.slice(6, 22).map((hour) => {
                          const hourEvents = getEventsForHour(currentDate, hour)
                          return (
                            <div
                              key={hour}
                              className="flex hover:bg-accent/50 transition-colors cursor-pointer min-h-[60px]"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  startDate: format(currentDate, "yyyy-MM-dd"),
                                  endDate: format(currentDate, "yyyy-MM-dd"),
                                  startTime: `${hour.toString().padStart(2, "0")}:00`,
                                  endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
                                })
                                setShowCreateDialog(true)
                              }}
                            >
                              <div className="w-20 p-3 text-sm text-muted-foreground border-r flex-shrink-0">
                                {hour.toString().padStart(2, "0")}:00
                              </div>
                              <div className="flex-1 p-2 space-y-1">
                                {hourEvents.map((event) => (
                                  <div
                                    key={event.id}
                                    className={cn(
                                      "p-2 rounded text-white cursor-pointer",
                                      getEventTypeColor(event.type),
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openEditDialog(event)
                                    }}
                                  >
                                    <div className="font-medium">{event.title}</div>
                                    <div className="text-xs opacity-90">
                                      {event.startTime} - {event.endTime}
                                      {event.location && ` • ${event.location}`}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: Selected Date Details */}
            <Card>
              <CardContent className="p-6">
                {selectedDate ? (
                  <>
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold">{format(selectedDate, "dd.MM.yyyy", { locale: de })}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(selectedDate, "eeee", { locale: de })}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-sm text-muted-foreground">
                          {getEventsForDay(selectedDate).length} Termine
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {getEventsForDay(selectedDate).length > 0 ? (
                        // Day view - event list with recurrence indicator
                        getEventsForDay(selectedDate).map((event) => (
                          <div
                            key={event.id}
                            onClick={() => openEditDialog(event)}
                            className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{event.title}</p>
                                {event.recurrence && event.recurrence !== "none" && (
                                  <Repeat
                                    className="h-3.5 w-3.5 text-muted-foreground"
                                    title={`Wiederholung: ${event.recurrence === "daily" ? "Täglich" : event.recurrence === "weekly" ? "Wöchentlich" : event.recurrence === "monthly" ? "Monatlich" : "Jährlich"}`}
                                  />
                                )}
                              </div>
                              <Badge
                                variant={event.priority === "high" ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {event.priority === "high"
                                  ? "Hoch"
                                  : event.priority === "medium"
                                    ? "Mittel"
                                    : "Niedrig"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {event.isAllDay ? "Ganztägig" : `${event.startTime} - ${event.endTime}`}
                              {event.recurrence && event.recurrence !== "none" && (
                                <span className="ml-2 flex items-center gap-1">
                                  <Repeat className="h-3 w-3" />
                                  {event.recurrence === "daily"
                                    ? "Täglich"
                                    : event.recurrence === "weekly"
                                      ? "Wöchentlich"
                                      : event.recurrence === "monthly"
                                        ? "Monatlich"
                                        : "Jährlich"}
                                </span>
                              )}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="font-medium text-muted-foreground mb-2">Keine Termine geplant</p>
                          <p className="text-sm text-muted-foreground">
                            Klicken Sie auf "Termin hinzufügen" um einen neuen Termin zu erstellen
                          </p>
                        </div>
                      )}
                    </div>

                    <Button className="w-full mt-6" onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Termin hinzufügen
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Wählen Sie ein Datum aus</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Upcoming Events Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Kommende Termine (nächste 7 Tage)</h3>
              <div className="space-y-3">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => openEditDialog(event)}
                      className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className={cn("w-1 h-full rounded", getEventTypeColor(event.type))} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{event.title}</p>
                            <span
                              className={cn(
                                "px-2 py-0.5 text-xs font-medium rounded-full",
                                getEventTypeLabel(event.type).bgColor,
                                getEventTypeLabel(event.type).textColor,
                              )}
                            >
                              {getEventTypeLabel(event.type).label}
                            </span>
                          </div>
                          <Badge variant={event.priority === "high" ? "destructive" : "secondary"}>
                            {event.priority === "high" ? "Hoch" : event.priority === "medium" ? "Mittel" : "Niedrig"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(event.startDate), "dd.MM.yyyy", { locale: de })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.isAllDay ? "Ganztägig" : `${event.startTime} - ${event.endTime}`}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          )}
                        </div>
                        {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Keine kommenden Termine</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Events Tab */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Alle Termine</h3>
              <div className="space-y-3">
                {filteredAndSortedEvents.length > 0 ? (
                  filteredAndSortedEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => openEditDialog(event)}
                      className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className={cn("w-1 h-full rounded", getEventTypeColor(event.type))} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <p className="font-medium">{event.title}</p>
                          <Badge variant={event.priority === "high" ? "destructive" : "secondary"}>
                            {event.priority === "high" ? "Hoch" : event.priority === "medium" ? "Mittel" : "Niedrig"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(event.startDate), "dd.MM.yyyy", { locale: de })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.isAllDay ? "Ganztägig" : `${event.startTime} - ${event.endTime}`}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          )}
                        </div>
                        {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Keine Termine gefunden</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neuen Termin erstellen</DialogTitle>
            <DialogDescription>Fügen Sie einen neuen Termin zum Kalender hinzu</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="z.B. Team-Meeting"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Zusätzliche Details..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Startdatum *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Enddatum *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAllDay"
                checked={formData.isAllDay}
                onCheckedChange={(checked) => setFormData({ ...formData, isAllDay: checked === true })}
              />
              <Label htmlFor="isAllDay">Ganztägig</Label>
            </div>

            {!formData.isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Startzeit</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">Endzeit</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Typ</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    setFormData({ ...formData, type: value as any })
                    // Reset related fields when type changes
                    if (value !== "meeting" && value !== "interview") {
                      setFormData((prev) => ({ ...prev, meetingLink: "", isOnline: false }))
                    }
                    if (value !== "interview") {
                      setFormData((prev) => ({
                        ...prev,
                        interviewType: "",
                        interviewStatus: "scheduled",
                        candidateEmail: "",
                      }))
                    }
                    if (value !== "training") {
                      setFormData((prev) => ({ ...prev, trainingCourseId: "", trainingStatus: "upcoming" }))
                    }
                  }}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="training">Schulung</SelectItem>
                    <SelectItem value="maintenance">Wartung</SelectItem>
                    <SelectItem value="task">Aufgabe</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="holiday">Feiertag</SelectItem>
                    <SelectItem value="announcement">Ankündigung</SelectItem>
                    <SelectItem value="interview">Vorstellungsgespräch</SelectItem>
                    <SelectItem value="other">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priorität</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional fields based on event type */}
            {formData.type === "interview" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="interviewType">Gesprächstyp</Label>
                    <Input
                      id="interviewType"
                      value={formData.interviewType}
                      onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })}
                      placeholder="z.B. Erstgespräch"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="candidateEmail">Bewerber-E-Mail</Label>
                    <Input
                      id="candidateEmail"
                      type="email"
                      value={formData.candidateEmail}
                      onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                      placeholder="z.B. bewerber@example.com"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="interviewStatus">Status</Label>
                  <Select
                    value={formData.interviewStatus}
                    onValueChange={(value) => setFormData({ ...formData, interviewStatus: value })}
                  >
                    <SelectTrigger id="interviewStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Geplant</SelectItem>
                      <SelectItem value="completed">Abgeschlossen</SelectItem>
                      <SelectItem value="canceled">Abgesagt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {(formData.type === "meeting" || formData.type === "interview") && (
              <div className="grid gap-2">
                <Label htmlFor="meetingLink">Besprechungs-Link</Label>
                <Input
                  id="meetingLink"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  placeholder="z.B. https://meet.google.com/abc-def-ghi"
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="isOnline"
                    checked={formData.isOnline}
                    onCheckedChange={(checked) => setFormData({ ...formData, isOnline: checked === true })}
                  />
                  <Label htmlFor="isOnline">Online-Meeting</Label>
                </div>
              </div>
            )}

            {formData.type === "training" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="trainingCourseId">Kurs-ID</Label>
                  <Input
                    id="trainingCourseId"
                    value={formData.trainingCourseId}
                    onChange={(e) => setFormData({ ...formData, trainingCourseId: e.target.value })}
                    placeholder="z.B. T456"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="trainingStatus">Status</Label>
                  <Select
                    value={formData.trainingStatus}
                    onValueChange={(value) => setFormData({ ...formData, trainingStatus: value })}
                  >
                    <SelectTrigger id="trainingStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Bevorstehend</SelectItem>
                      <SelectItem value="in-progress">In Bearbeitung</SelectItem>
                      <SelectItem value="completed">Abgeschlossen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="location">Ort</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="z.B. Konferenzraum 1"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="recurrence">Wiederholung</Label>
              <Select
                value={formData.recurrence}
                onValueChange={(value) => setFormData({ ...formData, recurrence: value })}
              >
                <SelectTrigger id="recurrence">
                  <SelectValue placeholder="Keine Wiederholung" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateEvent} disabled={!formData.title}>
              Termin erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Termin bearbeiten</DialogTitle>
            <DialogDescription>Bearbeiten Sie die Termindetails</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Titel *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Beschreibung</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-startDate">Startdatum *</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-endDate">Enddatum *</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isAllDay"
                checked={formData.isAllDay}
                onCheckedChange={(checked) => setFormData({ ...formData, isAllDay: checked === true })}
              />
              <Label htmlFor="edit-isAllDay">Ganztägig</Label>
            </div>

            {!formData.isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-startTime">Startzeit</Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-endTime">Endzeit</Label>
                  <Input
                    id="edit-endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Typ</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    setFormData({ ...formData, type: value as any })
                    // Reset related fields when type changes
                    if (value !== "meeting" && value !== "interview") {
                      setFormData((prev) => ({ ...prev, meetingLink: "", isOnline: false }))
                    }
                    if (value !== "interview") {
                      setFormData((prev) => ({
                        ...prev,
                        interviewType: "",
                        interviewStatus: "scheduled",
                        candidateEmail: "",
                      }))
                    }
                    if (value !== "training") {
                      setFormData((prev) => ({ ...prev, trainingCourseId: "", trainingStatus: "upcoming" }))
                    }
                  }}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="training">Schulung</SelectItem>
                    <SelectItem value="maintenance">Wartung</SelectItem>
                    <SelectItem value="task">Aufgabe</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="holiday">Feiertag</SelectItem>
                    <SelectItem value="announcement">Ankündigung</SelectItem>
                    <SelectItem value="interview">Vorstellungsgespräch</SelectItem>
                    <SelectItem value="other">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-priority">Priorität</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                >
                  <SelectTrigger id="edit-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional fields based on event type */}
            {formData.type === "interview" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-interviewType">Gesprächstyp</Label>
                    <Input
                      id="edit-interviewType"
                      value={formData.interviewType}
                      onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })}
                      placeholder="z.B. Erstgespräch"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-candidateEmail">Bewerber-E-Mail</Label>
                    <Input
                      id="edit-candidateEmail"
                      type="email"
                      value={formData.candidateEmail}
                      onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                      placeholder="z.B. bewerber@example.com"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-interviewStatus">Status</Label>
                  <Select
                    value={formData.interviewStatus}
                    onValueChange={(value) => setFormData({ ...formData, interviewStatus: value })}
                  >
                    <SelectTrigger id="edit-interviewStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Geplant</SelectItem>
                      <SelectItem value="completed">Abgeschlossen</SelectItem>
                      <SelectItem value="canceled">Abgesagt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {(formData.type === "meeting" || formData.type === "interview") && (
              <div className="grid gap-2">
                <Label htmlFor="edit-meetingLink">Besprechungs-Link</Label>
                <Input
                  id="edit-meetingLink"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  placeholder="z.B. https://meet.google.com/abc-def-ghi"
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="edit-isOnline"
                    checked={formData.isOnline}
                    onCheckedChange={(checked) => setFormData({ ...formData, isOnline: checked === true })}
                  />
                  <Label htmlFor="edit-isOnline">Online-Meeting</Label>
                </div>
              </div>
            )}

            {formData.type === "training" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="edit-trainingCourseId">Kurs-ID</Label>
                  <Input
                    id="edit-trainingCourseId"
                    value={formData.trainingCourseId}
                    onChange={(e) => setFormData({ ...formData, trainingCourseId: e.target.value })}
                    placeholder="z.B. T456"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-trainingStatus">Status</Label>
                  <Select
                    value={formData.trainingStatus}
                    onValueChange={(value) => setFormData({ ...formData, trainingStatus: value })}
                  >
                    <SelectTrigger id="edit-trainingStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Bevorstehend</SelectItem>
                      <SelectItem value="in-progress">In Bearbeitung</SelectItem>
                      <SelectItem value="completed">Abgeschlossen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edit-location">Ort</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-recurrence">Wiederholung</Label>
              <Select
                value={formData.recurrence}
                onValueChange={(value) => setFormData({ ...formData, recurrence: value })}
              >
                <SelectTrigger id="edit-recurrence">
                  <SelectValue placeholder="Keine Wiederholung" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateEvent} disabled={!formData.title}>
              Speichern
            </Button>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Abbrechen
            </Button>
            {/* Replace the delete button in the edit dialog to open confirmation dialog */}
            <Button variant="ghost" onClick={() => setShowDeleteDialog(true)}>
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              KI-Terminassistent
            </DialogTitle>
            <DialogDescription>
              Beschreiben Sie Ihren Terminwunsch und die KI schlägt optimale Zeiten für Praxis-Management vor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick suggestion badges */}
            <div className="flex flex-wrap gap-2">
              {[
                "Team-Meeting nächste Woche",
                "QM-Besprechung monatlich",
                "Mitarbeiterschulung",
                "Geräte-Wartung",
                "Inventur planen",
                "Vorstellungsgespräch für Entwickler",
              ].map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className="cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-colors"
                  onClick={() => setAiPrompt(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>

            {/* Text input for custom prompt */}
            <Textarea
              placeholder="z.B. 'Team-Meeting nächste Woche für 2 Stunden' oder 'Wartungstermin für Geräte im April'..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />

            <Button
              onClick={async () => {
                if (!currentPractice) {
                  toast({
                    title: "Fehler",
                    description: "Keine Praxis-ID gefunden. Bitte Seite neu laden.",
                    variant: "destructive",
                  })
                  return
                }
                if (!aiPrompt.trim()) {
                  toast({
                    title: "Hinweis",
                    description: "Bitte geben Sie eine Beschreibung ein.",
                    variant: "destructive",
                  })
                  return
                }
                setAiLoading(true)
                try {
                  const response = await fetch(`/api/practices/${currentPractice.id}/calendar/ai-suggest`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: aiPrompt }),
                  })
                  if (response.ok) {
                    const data = await response.json()
                    setAiSuggestions(data)
                    toast({
                      title: "Erfolg",
                      description: "KI-Vorschläge wurden generiert.",
                    })
                  } else {
                    toast({
                      title: "Fehler",
                      description: "Konnte keine Vorschläge generieren",
                      variant: "destructive",
                    })
                  }
                } catch (error) {
                  console.error("Error generating suggestions:", error)
                  toast({ title: "Fehler", description: "Verbindungsfehler", variant: "destructive" })
                } finally {
                  setAiLoading(false)
                }
              }}
              disabled={aiLoading || !aiPrompt.trim()}
              className="w-full bg-purple-500 hover:bg-purple-600"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generiere Vorschläge...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Vorschläge generieren
                </>
              )}
            </Button>

            {/* AI Suggestions Results */}
            {aiSuggestions && aiSuggestions.events && aiSuggestions.events.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="font-medium text-sm text-muted-foreground">Vorgeschlagene Termine:</h4>
                {aiSuggestions.events.map((event: any, index: number) => (
                  <Card key={index} className="border-purple-100">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">{event.title}</h5>
                          <Button
                            size="sm"
                            className="bg-purple-500 hover:bg-purple-600"
                            onClick={() => {
                              // Add the suggested event
                              setShowCreateDialog(true)
                              setShowAIDialog(false)
                              // Pre-fill the create dialog with suggestion data
                              setFormData({
                                ...formData,
                                title: event.title || "",
                                description: event.description || "",
                                startDate: event.startDate
                                  ? format(new Date(event.startDate), "yyyy-MM-dd")
                                  : formData.startDate,
                                endDate: event.endDate
                                  ? format(new Date(event.endDate), "yyyy-MM-dd")
                                  : formData.endDate,
                                startTime: event.startTime || formData.startTime,
                                endTime: event.endTime || formData.endTime,
                                type: event.type || formData.type,
                                priority: event.priority || formData.priority,
                                location: event.location || "",
                                isAllDay: event.isAllDay || formData.isAllDay,
                                recurrence: event.recurrence || formData.recurrence,
                                // New fields
                                interviewType: event.interviewType || "",
                                interviewStatus: event.interviewStatus || "scheduled",
                                candidateEmail: event.candidateEmail || "",
                                meetingLink: event.meetingLink || "",
                                trainingCourseId: event.trainingCourseId || "",
                                trainingStatus: event.trainingStatus || "upcoming",
                                isOnline: event.isOnline || false,
                              })
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Übernehmen
                          </Button>
                        </div>
                        {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {event.startDate ? new Date(event.startDate).toLocaleDateString("de-DE") : "Flexibel"}
                          </div>
                          {event.startTime && event.endTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.startTime} - {event.endTime} Uhr
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {aiSuggestions.reasoning && (
                  <p className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded">
                    {aiSuggestions.reasoning}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAIDialog(false)
                setAiPrompt("")
                setAiSuggestions(null)
              }}
            >
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add AlertDialog for delete confirmation before the closing fragment */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Termin löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Termin "{selectedEvent?.title}" wirklich löschen? Diese Aktion kann nicht rückgängig
              gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

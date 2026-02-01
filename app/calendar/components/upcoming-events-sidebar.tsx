"use client"

import { useMemo } from "react"
import { format, isToday, isTomorrow, addDays } from "date-fns"
import { de } from "date-fns/locale"
import { Calendar, Clock, MapPin, ChevronRight, CalendarDays, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "../types"
import { getPriorityConfig } from "../types"

interface UpcomingEventsSidebarProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

const priorityColors: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-green-500",
}

const typeColors: Record<string, string> = {
  meeting: "bg-blue-500",
  deadline: "bg-red-500",
  reminder: "bg-amber-500",
  task: "bg-purple-500",
  event: "bg-green-500",
  other: "bg-gray-500",
}

function EventCard({ event, onEventClick }: { event: CalendarEvent; onEventClick: (e: CalendarEvent) => void }) {
  const typeColor = typeColors[event.type] || typeColors.other
  const priorityConfig = getPriorityConfig(event.priority)

  return (
    <button
      onClick={() => onEventClick(event)}
      className={cn(
        "w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-200 group relative",
        event.priority === "high" && "border-l-4 border-l-red-500",
        event.priority === "medium" && "border-l-4 border-l-amber-500"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-1 h-full min-h-[40px] rounded-full flex-shrink-0", typeColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {event.priority === "high" && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex-shrink-0">
                  <AlertCircle className="h-3 w-3" />
                  Hoch
                </span>
              )}
              {event.priority === "medium" && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex-shrink-0">
                  Mittel
                </span>
              )}
              <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {event.title}
              </h4>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {!event.isAllDay && event.startTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {event.startTime}
                {event.endTime && ` - ${event.endTime}`}
              </span>
            )}
            {event.isAllDay && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Ganztägig
              </span>
            )}
          </div>
          {event.location && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

function DaySection({ 
  title, 
  subtitle, 
  events, 
  onEventClick,
  isToday: isTodaySection 
}: { 
  title: string
  subtitle: string
  events: CalendarEvent[]
  onEventClick: (e: CalendarEvent) => void
  isToday?: boolean
}) {
  return (
    <div className="space-y-2">
      <div>
        <h3 className={cn(
          "font-semibold text-sm",
          isTodaySection && "text-primary"
        )}>
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      
      {events.length > 0 ? (
        <div className="space-y-2 pl-1">
          {events.map((event) => (
            <EventCard key={event.id} event={event} onEventClick={onEventClick} />
          ))}
        </div>
      ) : (
        <div className="pl-1 py-4 text-center">
          <p className="text-sm text-muted-foreground">Keine Termine</p>
        </div>
      )}
    </div>
  )
}

export function UpcomingEventsSidebar({ events, onEventClick }: UpcomingEventsSidebarProps) {
  const today = new Date()
  const tomorrow = addDays(today, 1)

  const todayStr = format(today, "yyyy-MM-dd")
  const tomorrowStr = format(tomorrow, "yyyy-MM-dd")

  const todayEvents = useMemo(() => {
    return events
      .filter((e) => e && e.startDate === todayStr)
      .sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1
        if (!a.isAllDay && b.isAllDay) return 1
        if (!a.startTime || !b.startTime) return 0
        return a.startTime.localeCompare(b.startTime)
      })
  }, [events, todayStr])

  const tomorrowEvents = useMemo(() => {
    return events
      .filter((e) => e && e.startDate === tomorrowStr)
      .sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1
        if (!a.isAllDay && b.isAllDay) return 1
        if (!a.startTime || !b.startTime) return 0
        return a.startTime.localeCompare(b.startTime)
      })
  }, [events, tomorrowStr])

  const totalEvents = todayEvents.length + tomorrowEvents.length

  return (
    <div className="w-56 flex-shrink-0 border-l bg-muted/30 p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-semibold text-lg">Nächste Termine</h2>
        <p className="text-xs text-muted-foreground">
          {totalEvents} {totalEvents === 1 ? "Termin" : "Termine"} in den nächsten 2 Tagen
        </p>
      </div>

      {/* Today Section */}
      <DaySection
        title="Heute"
        subtitle={format(today, "EEEE, d. MMMM", { locale: de })}
        events={todayEvents}
        onEventClick={onEventClick}
        isToday={true}
      />

      {/* Divider */}
      <div className="border-t" />

      {/* Tomorrow Section */}
      <DaySection
        title="Morgen"
        subtitle={format(tomorrow, "EEEE, d. MMMM", { locale: de })}
        events={tomorrowEvents}
        onEventClick={onEventClick}
        isToday={false}
      />
    </div>
  )
}

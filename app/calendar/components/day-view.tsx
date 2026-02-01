"use client"

import { format, isSameDay, parseISO } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, MapPin, Repeat, Lock, Globe, Users, User } from "lucide-react"
import type { CalendarEvent } from "../types"
import { getEventTypeColor, getEventTypeLabel, getVisibilityConfig, HOURS } from "../types"

const VisibilityBadge = ({ visibility }: { visibility?: string }) => {
  if (!visibility) return null
  const config = getVisibilityConfig(visibility)
  return (
    <span className="flex items-center gap-1 text-xs bg-white/20 px-1.5 py-0.5 rounded">
      {visibility === "private" && <Lock className="h-3 w-3" />}
      {visibility === "public" && <Globe className="h-3 w-3" />}
      {visibility === "team" && <Users className="h-3 w-3" />}
      {visibility === "members" && <User className="h-3 w-3" />}
      {config.shortLabel}
    </span>
  )
}

interface DayViewProps {
  currentDate: Date
  getEventsForHour: (day: Date, hour: number) => CalendarEvent[]
  getAllDayEventsForDay: (day: Date) => CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function DayView({ currentDate, getEventsForHour, getAllDayEventsForDay, onEventClick }: DayViewProps) {
  const getHourEvents = (hour: number) => {
    return (getEventsForHour(currentDate, hour) || []).filter(e => e && e.title)
  }

  const allDayEvents = (getAllDayEventsForDay(currentDate) || []).filter(e => e && e.title)

  return (
    <div className="bg-card rounded-lg border">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">
          {format(currentDate, "EEEE, d. MMMM yyyy", { locale: de })}
        </h2>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="p-4 border-b bg-muted/30">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Ganztägige Termine</h3>
          <div className="flex flex-wrap gap-2">
            {allDayEvents.map((event) => (
              <div
                key={event.id}
                className={cn(
                  "px-3 py-2 rounded text-white cursor-pointer hover:opacity-80",
                  getEventTypeColor(event.type)
                )}
                onClick={() => onEventClick(event)}
              >
                <div className="flex items-center gap-2">
                  {event.isRecurringInstance && <Repeat className="h-3 w-3" />}
                  <span className="font-medium">{event.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <ScrollArea className="h-[600px]">
        <div className="divide-y">
          {HOURS.map((hour) => {
            const hourEvents = getHourEvents(hour)
            return (
              <div key={hour} className="flex min-h-[60px]">
                <div className="w-20 p-2 text-sm text-muted-foreground border-r flex-shrink-0">
                  {hour.toString().padStart(2, "0")}:00
                </div>
                <div className="flex-1 p-2">
                  {hourEvents.map((event) => {
                    const typeLabel = getEventTypeLabel(event.type)
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "p-3 rounded mb-2 cursor-pointer hover:opacity-90 transition-opacity",
                          getEventTypeColor(event.type),
                          "text-white"
                        )}
                        onClick={() => onEventClick(event)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {event.isRecurringInstance && <Repeat className="h-3 w-3" />}
                              <span className="font-medium">{event.title}</span>
                              <VisibilityBadge visibility={event.visibility} />
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm opacity-90">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.startTime} - {event.endTime}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                            {typeLabel.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

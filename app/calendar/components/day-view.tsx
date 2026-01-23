"use client"

import { format, isSameDay, parseISO } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, MapPin, Repeat } from "lucide-react"
import type { CalendarEvent } from "../types"
import { getEventTypeColor, getEventTypeLabel, HOURS } from "../types"

interface DayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onSelectEvent: (event: CalendarEvent) => void
}

export function DayView({ currentDate, events, onSelectEvent }: DayViewProps) {
  const getEventsForHour = (hour: number) => {
    return events.filter((event) => {
      if (event.isAllDay) return false
      const eventStart = parseISO(event.startDate)
      const eventStartHour = parseInt(event.startTime?.split(":")[0] || "0", 10)
      return isSameDay(eventStart, currentDate) && eventStartHour === hour
    })
  }

  const allDayEvents = events.filter((event) => {
    if (!event.isAllDay) return false
    const eventStart = parseISO(event.startDate)
    const eventEnd = parseISO(event.endDate)
    return currentDate >= eventStart && currentDate <= eventEnd
  })

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
                onClick={() => onSelectEvent(event)}
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
            const hourEvents = getEventsForHour(hour)
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
                        onClick={() => onSelectEvent(event)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {event.isRecurringInstance && <Repeat className="h-3 w-3" />}
                              <span className="font-medium">{event.title}</span>
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

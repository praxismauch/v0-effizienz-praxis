"use client"

import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Repeat, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "../types"
import { getEventTypeColor, getEventTypeLabel } from "../types"

interface EventListProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  title?: string
  emptyMessage?: string
}

export function EventList({ events, onEventClick, title, emptyMessage = "Keine Termine vorhanden" }: EventListProps) {
  // Filter out any undefined/null events or events without titles
  const safeEvents = (events || []).filter(e => e && e.title)
  
  if (safeEvents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  // Group events by date
  const groupedEvents = safeEvents.reduce(
    (groups, event) => {
      const date = event.startDate
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(event)
      return groups
    },
    {} as Record<string, CalendarEvent[]>
  )

  const sortedDates = Object.keys(groupedEvents).sort()

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => {
        const dayEvents = groupedEvents[date]
        return (
          <div key={date}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {format(parseISO(date), "EEEE, d. MMMM yyyy", { locale: de })}
            </h3>
            <div className="space-y-2">
              {dayEvents.map((event) => {
                const typeLabel = getEventTypeLabel(event.type)
                return (
                  <Card
                    key={event.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onEventClick(event)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "w-1 h-full min-h-[60px] rounded-full flex-shrink-0",
                            getEventTypeColor(event.type)
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                {event.isRecurringInstance && (
                                  <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                <h4 className="font-medium truncate">{event.title}</h4>
                              </div>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                            </div>
                            <Badge className={cn(typeLabel.bgColor, typeLabel.textColor, "flex-shrink-0")}>
                              {typeLabel.label}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            {!event.isAllDay ? (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {event.startTime} - {event.endTime}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                Ganztägig
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

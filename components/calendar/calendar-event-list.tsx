"use client"

import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Clock, MapPin, CalendarIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type CalendarEvent, getEventTypeColor, getEventTypeLabel } from "./calendar-utils"

interface CalendarEventListProps {
  title: string
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  emptyMessage?: string
}

export default function CalendarEventList({
  title,
  events,
  onEventClick,
  emptyMessage = "Keine Termine",
}: CalendarEventListProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="space-y-3">
          {events.length > 0 ? (
            events.map((event) => (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
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
            <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

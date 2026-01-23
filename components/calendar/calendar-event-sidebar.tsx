"use client"

import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Clock, MapPin, CalendarIcon, Plus, Repeat } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type CalendarEvent, getRecurrenceLabel } from "./calendar-utils"

interface CalendarEventSidebarProps {
  selectedDate: Date | null
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onAddEvent: () => void
}

export default function CalendarEventSidebar({
  selectedDate,
  events,
  onEventClick,
  onAddEvent,
}: CalendarEventSidebarProps) {
  const getEventsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd")
    return events.filter((event) => event.startDate === dayStr)
  }

  if (!selectedDate) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Wählen Sie ein Datum aus</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const dayEvents = getEventsForDay(selectedDate)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-2xl font-bold">{format(selectedDate, "dd.MM.yyyy", { locale: de })}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {format(selectedDate, "eeee", { locale: de })}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm text-muted-foreground">
              {dayEvents.length} Termine
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {dayEvents.length > 0 ? (
            dayEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{event.title}</p>
                    {event.recurrence && event.recurrence !== "none" && (
                      <Repeat
                        className="h-3.5 w-3.5 text-muted-foreground"
                        title={`Wiederholung: ${getRecurrenceLabel(event.recurrence)}`}
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
                      {getRecurrenceLabel(event.recurrence)}
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

        <Button className="w-full mt-6" onClick={onAddEvent}>
          <Plus className="h-4 w-4 mr-2" />
          Termin hinzufügen
        </Button>
      </CardContent>
    </Card>
  )
}

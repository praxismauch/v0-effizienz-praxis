"use client"

import { format, isToday } from "date-fns"
import { de } from "date-fns/locale"
import { Repeat } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { type CalendarEvent, getEventTypeColor, HOURS } from "./calendar-utils"

interface CalendarDayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onTimeSlotClick: (hour: number) => void
}

export default function CalendarDayView({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
}: CalendarDayViewProps) {
  const getEventsForHour = (hour: number) => {
    const dayStr = format(currentDate, "yyyy-MM-dd")
    return events.filter((event) => {
      if (event.startDate !== dayStr) return false
      if (event.isAllDay) return false
      const eventHour = Number.parseInt(event.startTime.split(":")[0], 10)
      return eventHour === hour
    })
  }

  const getAllDayEventsForDay = () => {
    const dayStr = format(currentDate, "yyyy-MM-dd")
    return events.filter((event) => event.startDate === dayStr && event.isAllDay)
  }

  return (
    <div className="overflow-hidden">
      {/* Day header */}
      <div className="border-b p-4 text-center">
        <div className={cn("text-2xl font-bold", isToday(currentDate) && "text-blue-600")}>
          {format(currentDate, "dd. MMMM yyyy", { locale: de })}
        </div>
        <div className="text-muted-foreground">{format(currentDate, "EEEE", { locale: de })}</div>
        {/* All-day events */}
        {getAllDayEventsForDay().length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {getAllDayEventsForDay().map((event) => (
              <Badge
                key={event.id}
                className={cn(
                  "cursor-pointer flex items-center gap-1",
                  getEventTypeColor(event.type),
                  "text-white",
                )}
                onClick={() => onEventClick(event)}
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
            const hourEvents = getEventsForHour(hour)
            return (
              <div
                key={hour}
                className="flex hover:bg-accent/50 transition-colors cursor-pointer min-h-[60px]"
                onClick={() => onTimeSlotClick(hour)}
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
                        onEventClick(event)
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
  )
}

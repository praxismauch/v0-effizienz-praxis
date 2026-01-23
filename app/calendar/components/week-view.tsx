"use client"

import { format, isSameDay, isToday, parseISO, addDays, startOfWeek, endOfWeek } from "date-fns"
import { de } from "date-fns/locale"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { CalendarEvent } from "../types"
import { getEventTypeColor, HOURS } from "../types"

interface WeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onSelectEvent: (event: CalendarEvent) => void
}

export function WeekView({ currentDate, events, onSelectEvent }: WeekViewProps) {
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
    const days = []
    let day = weekStart
    while (day <= weekEnd) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [currentDate])

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter((event) => {
      if (event.isAllDay) return false
      const eventStart = parseISO(event.startDate)
      const eventStartHour = parseInt(event.startTime?.split(":")[0] || "0", 10)
      return isSameDay(eventStart, day) && eventStartHour === hour
    })
  }

  const getAllDayEvents = (day: Date) => {
    return events.filter((event) => {
      if (!event.isAllDay) return false
      const eventStart = parseISO(event.startDate)
      const eventEnd = parseISO(event.endDate)
      return day >= eventStart && day <= eventEnd
    })
  }

  return (
    <div className="bg-card rounded-lg border">
      {/* Header with weekdays */}
      <div className="grid grid-cols-8 border-b">
        <div className="p-3 text-center text-sm font-medium text-muted-foreground border-r">Zeit</div>
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={cn(
              "p-3 text-center border-r last:border-r-0",
              isToday(day) && "bg-primary/10"
            )}
          >
            <div className="text-sm font-medium">{format(day, "EEE", { locale: de })}</div>
            <div
              className={cn(
                "text-lg font-bold",
                isToday(day) && "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto"
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* All-day events row */}
      <div className="grid grid-cols-8 border-b min-h-[40px]">
        <div className="p-2 text-xs text-muted-foreground border-r flex items-center justify-center">
          Ganztägig
        </div>
        {weekDays.map((day, dayIndex) => {
          const allDayEvents = getAllDayEvents(day)
          return (
            <div key={dayIndex} className="p-1 border-r last:border-r-0 flex flex-wrap gap-1">
              {allDayEvents.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 truncate max-w-full",
                    getEventTypeColor(event.type)
                  )}
                  onClick={() => onSelectEvent(event)}
                  title={event.title}
                >
                  {event.title}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-8">
          {HOURS.map((hour) => (
            <div key={hour} className="contents">
              <div className="p-2 text-xs text-muted-foreground border-r border-b text-center">
                {hour.toString().padStart(2, "0")}:00
              </div>
              {weekDays.map((day, dayIndex) => {
                const hourEvents = getEventsForDayAndHour(day, hour)
                return (
                  <div
                    key={`${hour}-${dayIndex}`}
                    className={cn(
                      "p-1 border-r border-b last:border-r-0 min-h-[50px]",
                      isToday(day) && "bg-primary/5"
                    )}
                  >
                    {hourEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 truncate",
                          getEventTypeColor(event.type)
                        )}
                        onClick={() => onSelectEvent(event)}
                        title={event.title}
                      >
                        {event.startTime} - {event.title}
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
  )
}

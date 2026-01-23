"use client"

import { format, isSameMonth, isSameDay, isToday, parseISO, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { de } from "date-fns/locale"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Repeat } from "lucide-react"
import type { CalendarEvent } from "../types"
import { getEventTypeColor } from "../types"

interface MonthViewProps {
  currentDate: Date
  selectedDate: Date | null
  events: CalendarEvent[]
  onSelectDate: (date: Date) => void
  onSelectEvent: (event: CalendarEvent) => void
}

export function MonthView({
  currentDate,
  selectedDate,
  events,
  onSelectDate,
  onSelectEvent,
}: MonthViewProps) {
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

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventStart = parseISO(event.startDate)
      const eventEnd = parseISO(event.endDate)
      return day >= eventStart && day <= eventEnd
    })
  }

  return (
    <div className="bg-card rounded-lg border">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isTodayDate = isToday(day)

          return (
            <div
              key={index}
              className={cn(
                "min-h-[100px] p-2 border-b border-r cursor-pointer transition-colors hover:bg-muted/50",
                !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                isSelected && "bg-primary/10 ring-2 ring-primary ring-inset",
                isTodayDate && !isSelected && "bg-primary/5"
              )}
              onClick={() => onSelectDate(day)}
            >
              <div className="flex justify-between items-start">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isTodayDate && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Events for this day */}
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-xs p-1 rounded truncate text-white cursor-pointer hover:opacity-80",
                      getEventTypeColor(event.type)
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectEvent(event)
                    }}
                    title={event.title}
                  >
                    <div className="flex items-center gap-1">
                      {event.isRecurringInstance && <Repeat className="h-2.5 w-2.5 flex-shrink-0" />}
                      <span className="truncate">{event.title}</span>
                    </div>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{dayEvents.length - 3} weitere
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

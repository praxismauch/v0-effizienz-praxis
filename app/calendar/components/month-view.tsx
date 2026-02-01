"use client"

import { format, isSameMonth, isSameDay, isToday, parseISO, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { de } from "date-fns/locale"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Repeat, AlertCircle } from "lucide-react"
import type { CalendarEvent } from "../types"
import { getEventTypeColor, getPriorityConfig } from "../types"

interface MonthViewProps {
  monthDays: Date[]
  currentDate: Date
  getEventsForDay: (day: Date) => CalendarEvent[]
  onDayClick: (day: Date) => void
  onEventClick: (event: CalendarEvent) => void
}

export function MonthView({
  monthDays,
  currentDate,
  getEventsForDay,
  onDayClick,
  onEventClick,
}: MonthViewProps) {
  // Use provided monthDays instead of calculating
  const calendarDays = monthDays

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
          const dayEvents = (getEventsForDay(day) || []).filter(e => e && e.title)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isTodayDate = isToday(day)

          return (
            <div
              key={index}
              className={cn(
                "min-h-[100px] p-2 border-b border-r cursor-pointer transition-colors hover:bg-muted/50",
                !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                isTodayDate && "bg-primary/5"
              )}
              onClick={() => onDayClick(day)}
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
                {dayEvents.slice(0, 3).map((event) => {
                  const priorityConfig = getPriorityConfig(event.priority)
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "text-xs p-1 rounded truncate text-white cursor-pointer hover:opacity-80 relative group",
                        getEventTypeColor(event.type),
                        event.priority === "high" && "ring-2 ring-red-400 ring-offset-1 ring-offset-background"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event)
                      }}
                      title={`${event.title} (Priorität: ${priorityConfig.label})`}
                    >
                      <div className="flex items-center gap-1">
                        {event.priority === "high" && (
                          <AlertCircle className="h-3 w-3 flex-shrink-0 text-white" />
                        )}
                        {event.priority === "medium" && (
                          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-300" />
                        )}
                        {event.isRecurringInstance && <Repeat className="h-2.5 w-2.5 flex-shrink-0" />}
                        <span className="truncate">{event.title}</span>
                      </div>
                    </div>
                  )
                })}
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

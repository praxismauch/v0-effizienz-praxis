"use client"

import { format, isSameMonth, isSameDay, isToday } from "date-fns"
import { Repeat } from "lucide-react"
import { cn } from "@/lib/utils"
import { type CalendarEvent, getEventTypeColor } from "./calendar-utils"

interface CalendarMonthViewProps {
  calendarDays: Date[]
  currentDate: Date
  selectedDate: Date | null
  events: CalendarEvent[]
  onSelectDate: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
}

export default function CalendarMonthView({
  calendarDays,
  currentDate,
  selectedDate,
  events,
  onSelectDate,
  onEventClick,
}: CalendarMonthViewProps) {
  const getEventsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd")
    return events.filter((event) => event.startDate === dayStr)
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Weekday headers */}
      {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
        <div key={day} className="text-center font-medium text-muted-foreground py-2 text-sm">
          {day}
        </div>
      ))}

      {/* Calendar days */}
      {calendarDays.map((day) => {
        const dayEvents = getEventsForDay(day)
        const isCurrentMonth = isSameMonth(day, currentDate)
        const isSelected = selectedDate && isSameDay(day, selectedDate)
        const isTodayDate = isToday(day)

        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate(day)}
            className={cn(
              "min-h-[80px] p-2 rounded-lg border text-left transition-all",
              isCurrentMonth ? "bg-card" : "bg-muted/30 text-muted-foreground",
              isSelected && "ring-2 ring-blue-500 border-blue-500",
              isTodayDate && !isSelected && "border-blue-300",
              "hover:bg-accent",
            )}
          >
            <div
              className={cn(
                "text-sm font-medium mb-1",
                !isCurrentMonth && "text-muted-foreground",
                isTodayDate && "font-bold",
              )}
            >
              {format(day, "d")}
            </div>
            <div className="space-y-0.5">
              {dayEvents.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "text-xs px-1 py-0.5 rounded text-white truncate flex items-center gap-1",
                    getEventTypeColor(event.type),
                  )}
                  title={event.title}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventClick(event)
                  }}
                >
                  {event.recurrence && event.recurrence !== "none" && (
                    <Repeat className="h-2.5 w-2.5 flex-shrink-0" />
                  )}
                  <span className="truncate">{event.title}</span>
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-xs text-muted-foreground pl-1">+{dayEvents.length - 2} mehr</div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

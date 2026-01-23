"use client"

import { format, isSameDay, isToday } from "date-fns"
import { de } from "date-fns/locale"
import { Repeat } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type CalendarEvent, getEventTypeColor, HOURS } from "./calendar-utils"

interface CalendarWeekViewProps {
  weekDays: Date[]
  selectedDate: Date | null
  events: CalendarEvent[]
  onSelectDate: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
  onTimeSlotClick: (date: Date, hour: number) => void
}

export default function CalendarWeekView({
  weekDays,
  selectedDate,
  events,
  onSelectDate,
  onEventClick,
  onTimeSlotClick,
}: CalendarWeekViewProps) {
  const getEventsForHour = (day: Date, hour: number) => {
    const dayStr = format(day, "yyyy-MM-dd")
    return events.filter((event) => {
      if (event.startDate !== dayStr) return false
      if (event.isAllDay) return false
      const eventHour = Number.parseInt(event.startTime.split(":")[0], 10)
      return eventHour === hour
    })
  }

  const getAllDayEventsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd")
    return events.filter((event) => event.startDate === dayStr && event.isAllDay)
  }

  return (
    <div className="overflow-hidden">
      {/* Week header */}
      <div className="grid grid-cols-8 border-b">
        <div className="p-2 text-center text-sm font-medium text-muted-foreground border-r">Zeit</div>
        {weekDays.map((day) => (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate(day)}
            className={cn(
              "p-2 text-center border-r last:border-r-0 hover:bg-accent transition-colors",
              isToday(day) && "bg-blue-50 dark:bg-blue-950/20",
              selectedDate && isSameDay(day, selectedDate) && "ring-2 ring-inset ring-blue-500",
            )}
          >
            <div className="text-sm font-medium">{format(day, "EEE", { locale: de })}</div>
            <div className={cn("text-lg", isToday(day) && "font-bold text-blue-600")}>
              {format(day, "d")}
            </div>
            {/* All-day events */}
            {getAllDayEventsForDay(day).length > 0 && (
              <div className="mt-1 space-y-0.5">
                {getAllDayEventsForDay(day)
                  .slice(0, 2)
                  .map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "text-xs px-1 rounded text-white truncate",
                        getEventTypeColor(event.type),
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event)
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Time slots */}
      <ScrollArea className="h-[500px]">
        <div className="grid grid-cols-8">
          {HOURS.slice(6, 22).map((hour) => (
            <div key={hour} className="contents">
              <div className="p-2 text-xs text-muted-foreground border-r border-b text-right pr-3">
                {hour.toString().padStart(2, "0")}:00
              </div>
              {weekDays.map((day) => {
                const hourEvents = getEventsForHour(day, hour)
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={cn(
                      "min-h-[50px] border-r border-b last:border-r-0 p-1 hover:bg-accent/50 transition-colors cursor-pointer",
                      isToday(day) && "bg-blue-50/50 dark:bg-blue-950/10",
                    )}
                    onClick={() => onTimeSlotClick(day, hour)}
                  >
                    {hourEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-xs px-1 py-0.5 rounded text-white truncate mb-0.5 cursor-pointer flex items-center gap-1",
                          getEventTypeColor(event.type),
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick(event)
                        }}
                      >
                        {event.recurrence && event.recurrence !== "none" && (
                          <Repeat className="h-2.5 w-2.5 flex-shrink-0" />
                        )}
                        <span className="truncate">
                          {event.startTime} {event.title}
                        </span>
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

"use client"

import { format, isToday } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, Lock, Globe, Users, User } from "lucide-react"
import type { CalendarEvent } from "../types"
import { getEventTypeColor, getPriorityConfig, HOURS } from "../types"

const VisibilityIcon = ({ visibility }: { visibility?: string }) => {
  if (!visibility || visibility === "public") return null
  const iconClass = "h-3 w-3 flex-shrink-0 opacity-80"
  switch (visibility) {
    case "private": return <Lock className={iconClass} />
    case "team": return <Users className={iconClass} />
    case "members": return <User className={iconClass} />
    default: return null
  }
}

interface WeekViewProps {
  weekDays: Date[]
  getEventsForHour: (day: Date, hour: number) => CalendarEvent[]
  getAllDayEventsForDay: (day: Date) => CalendarEvent[]
  onDayClick: (day: Date) => void
  onEventClick: (event: CalendarEvent) => void
}

export function WeekView({ 
  weekDays, 
  getEventsForHour, 
  getAllDayEventsForDay, 
  onDayClick, 
  onEventClick 
}: WeekViewProps) {

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Header with weekdays */}
      <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] border-b">
        <div className="p-3 text-center text-sm font-medium text-muted-foreground border-r">Zeit</div>
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={cn(
              "p-3 text-center border-r last:border-r-0 min-w-0",
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
      <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] border-b min-h-[40px]">
        <div className="p-2 text-xs text-muted-foreground border-r flex items-center justify-center">
          Ganztägig
        </div>
        {weekDays.map((day, dayIndex) => {
          const allDayEvents = getAllDayEventsForDay(day) || []
          return (
            <div key={dayIndex} className="p-1 border-r last:border-r-0 flex flex-wrap gap-1 min-w-0">
              {allDayEvents.filter(e => e && e.title).map((event) => {
                const priorityConfig = getPriorityConfig(event.priority)
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 truncate max-w-full flex items-center gap-1",
                      getEventTypeColor(event.type),
                      event.priority === "high" && "ring-2 ring-red-400 ring-offset-1 ring-offset-background"
                    )}
                    onClick={() => onEventClick(event)}
                    title={`${event.title} (Priorität: ${priorityConfig.label})`}
                  >
                    {event.priority === "high" && <AlertCircle className="h-3 w-3 flex-shrink-0" />}
                    {event.priority === "medium" && <span className="w-1.5 h-1.5 rounded-full bg-amber-300 flex-shrink-0" />}
                    <VisibilityIcon visibility={event.visibility} />
                    <span className="truncate">{event.title}</span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))]">
          {HOURS.map((hour) => (
            <div key={hour} className="contents">
              <div className="p-2 text-xs text-muted-foreground border-r border-b text-center w-[80px]">
                {hour.toString().padStart(2, "0")}:00
              </div>
              {weekDays.map((day, dayIndex) => {
                const hourEvents = (getEventsForHour(day, hour) || []).filter(e => e && e.title)
                return (
                  <div
                    key={`${hour}-${dayIndex}`}
                    className={cn(
                      "p-1 border-r border-b last:border-r-0 min-h-[50px] min-w-0",
                      isToday(day) && "bg-primary/5"
                    )}
                  >
                    {hourEvents.map((event) => {
                      const priorityConfig = getPriorityConfig(event.priority)
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 truncate flex items-center gap-1",
                            getEventTypeColor(event.type),
                            event.priority === "high" && "ring-2 ring-red-400 ring-offset-1 ring-offset-background"
                          )}
                          onClick={() => onEventClick(event)}
                          title={`${event.title} (Priorität: ${priorityConfig.label})`}
                        >
                          {event.priority === "high" && <AlertCircle className="h-3 w-3 flex-shrink-0" />}
                          {event.priority === "medium" && <span className="w-1.5 h-1.5 rounded-full bg-amber-300 flex-shrink-0" />}
                          <VisibilityIcon visibility={event.visibility} />
                          <span className="truncate">{event.startTime} - {event.title}</span>
                        </div>
                      )
                    })}
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

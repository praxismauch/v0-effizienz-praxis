"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react"
import type { CalendarView } from "../types"

interface CalendarHeaderProps {
  title: string
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  onAddEvent: () => void
}

export default function CalendarHeader({
  title,
  view,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  onAddEvent,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={onPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" onClick={onToday}>
          Heute
        </Button>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant={view === "month" ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => onViewChange("month")}
          >
            Monat
          </Button>
          <Button
            variant={view === "week" ? "default" : "ghost"}
            size="sm"
            className="rounded-none border-x"
            onClick={() => onViewChange("week")}
          >
            Woche
          </Button>
          <Button
            variant={view === "day" ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => onViewChange("day")}
          >
            Tag
          </Button>
        </div>
        <Button onClick={onAddEvent}>
          <Plus className="h-4 w-4 mr-2" />
          Termin
        </Button>
      </div>
    </div>
  )
}

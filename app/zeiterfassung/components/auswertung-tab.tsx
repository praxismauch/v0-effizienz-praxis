"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Download, Calendar, Clock, TrendingUp, BarChart3 } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"
import { de } from "date-fns/locale"
import type { TimeEntry } from "../types"

interface AuswertungTabProps {
  timeEntries: TimeEntry[]
  isLoading: boolean
  selectedMonth: Date
  onMonthChange: (date: Date) => void
}

export default function AuswertungTab({
  timeEntries,
  isLoading,
  selectedMonth,
  onMonthChange,
}: AuswertungTabProps) {
  const monthStart = startOfMonth(selectedMonth)
  const monthEnd = endOfMonth(selectedMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Calculate statistics
  const totalHours = timeEntries.reduce((sum, entry) => {
    if (entry.total_hours) return sum + entry.total_hours
    if (entry.start_time && entry.end_time) {
      const start = new Date(`2000-01-01T${entry.start_time}`)
      const end = new Date(`2000-01-01T${entry.end_time}`)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return sum + Math.max(0, hours - (entry.break_duration || 0) / 60)
    }
    return sum
  }, 0)

  const workDays = timeEntries.filter((e) => e.start_time && e.end_time).length
  const avgHoursPerDay = workDays > 0 ? totalHours / workDays : 0

  const getEntriesForDay = (day: Date) => {
    return timeEntries.filter((entry) => isSameDay(new Date(entry.date), day))
  }

  const formatDuration = (hours: number) => {
    if (!hours || isNaN(hours)) return "0h 0m"
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return new Date(date)
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <Select
          value={format(selectedMonth, "yyyy-MM")}
          onValueChange={(value) => onMonthChange(new Date(value + "-01"))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((date) => (
              <SelectItem key={format(date, "yyyy-MM")} value={format(date, "yyyy-MM")}>
                {format(date, "MMMM yyyy", { locale: de })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Gesamtstunden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{formatDuration(totalHours)}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Arbeitstage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{workDays}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Durchschnitt/Tag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{formatDuration(avgHoursPerDay)}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Einträge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{timeEntries.length}</span>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>Monatsübersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {/* Empty cells for alignment */}
            {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days */}
            {daysInMonth.map((day) => {
              const entries = getEntriesForDay(day)
              const dayHours = entries.reduce((sum, e) => sum + (e.total_hours || 0), 0)
              const hasEntries = entries.length > 0
              const isWeekend = day.getDay() === 0 || day.getDay() === 6

              return (
                <div
                  key={day.toISOString()}
                  className={`aspect-square p-1 rounded-lg border text-center flex flex-col items-center justify-center ${
                    hasEntries
                      ? "bg-primary/10 border-primary/30"
                      : isWeekend
                        ? "bg-muted/50 border-transparent"
                        : "border-transparent"
                  }`}
                >
                  <span className={`text-sm ${hasEntries ? "font-medium" : "text-muted-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  {hasEntries && <span className="text-xs text-primary">{dayHours.toFixed(1)}h</span>}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed List */}
      <Card>
        <CardHeader>
          <CardTitle>Detaillierte Einträge</CardTitle>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Keine Einträge für diesen Monat</p>
          ) : (
            <div className="space-y-2">
              {timeEntries
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{format(new Date(entry.date), "EEEE, dd.MM.yyyy", { locale: de })}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.start_time} - {entry.end_time}
                        {entry.break_duration ? ` (${entry.break_duration} Min. Pause)` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{formatDuration(entry.total_hours || 0)}</Badge>
                      {entry.work_location && (
                        <p className="text-xs text-muted-foreground mt-1">{entry.work_location}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

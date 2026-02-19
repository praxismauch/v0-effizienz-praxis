"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Download, Calendar, Clock, TrendingUp, BarChart3, Building2, Home, Car } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"
import { de } from "date-fns/locale"
import type { TimeBlock } from "../types"

interface AuswertungTabProps {
  timeEntries: TimeBlock[]
  isLoading: boolean
  selectedMonth: Date
  onMonthChange: (date: Date) => void
}

const locationLabels: Record<string, string> = {
  office: "Praxis vor Ort",
  homeoffice: "Homeoffice",
  mobile: "Mobil / Außentermin",
}

export default function AuswertungTab({
  timeEntries: blocks,
  isLoading,
  selectedMonth,
  onMonthChange,
}: AuswertungTabProps) {
  const monthStart = startOfMonth(selectedMonth)
  const monthEnd = endOfMonth(selectedMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Safely extract net minutes from a block
  const getBlockMinutes = (block: TimeBlock): number => {
    if (typeof block.net_minutes === "number" && !isNaN(block.net_minutes)) return block.net_minutes
    // Fallback: calculate from start_time / end_time
    if (block.start_time && block.end_time) {
      const start = new Date(`2000-01-01T${block.start_time}`)
      const end = new Date(`2000-01-01T${block.end_time}`)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const minutes = (end.getTime() - start.getTime()) / 60000
        return Math.max(0, minutes - (block.break_minutes || 0))
      }
    }
    return 0
  }

  // Calculate statistics from TimeBlock fields
  const totalNetMinutes = blocks.reduce((sum, block) => sum + getBlockMinutes(block), 0)

  const totalHours = totalNetMinutes / 60
  const totalBreakMinutes = blocks.reduce((sum, b) => sum + (b.break_minutes || 0), 0)

  const workDays = blocks.filter((b) => b.start_time && (b.end_time || b.is_open)).length
  const uniqueWorkDays = new Set(blocks.filter((b) => b.start_time).map((b) => b.date)).size
  const avgHoursPerDay = uniqueWorkDays > 0 ? totalHours / uniqueWorkDays : 0

  // Location breakdown
  const locationBreakdown = blocks.reduce(
    (acc, block) => {
      const loc = block.work_location || "office"
      acc[loc] = (acc[loc] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const getBlocksForDay = (day: Date) => {
    return blocks.filter((block) => isSameDay(new Date(block.date), day))
  }

  const formatDuration = (minutes: number) => {
    if (!minutes || isNaN(minutes)) return "0h 0min"
    const h = Math.floor(Math.abs(minutes) / 60)
    const m = Math.round(Math.abs(minutes) % 60)
    const sign = minutes < 0 ? "-" : ""
    return `${sign}${h}h ${m}min`
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
            <span className="text-2xl font-bold">{formatDuration(totalNetMinutes)}</span>
            {totalBreakMinutes > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                davon {formatDuration(totalBreakMinutes)} Pause
              </p>
            )}
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
            <span className="text-2xl font-bold">{uniqueWorkDays}</span>
            <p className="text-xs text-muted-foreground mt-1">{blocks.length} Einträge gesamt</p>
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
            <span className="text-2xl font-bold">{formatDuration(avgHoursPerDay * 60)}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Arbeitsorte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(locationBreakdown).map(([loc, count]) => (
                <div key={loc} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{locationLabels[loc] || loc}</span>
                  <Badge variant="secondary" className="text-xs">{count}x</Badge>
                </div>
              ))}
              {Object.keys(locationBreakdown).length === 0 && (
                <span className="text-sm text-muted-foreground">Keine Daten</span>
              )}
            </div>
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
              const dayBlocks = getBlocksForDay(day)
              const dayMinutes = dayBlocks.reduce((sum, b) => sum + getBlockMinutes(b), 0)
              const dayHours = dayMinutes / 60
              const hasEntries = dayBlocks.length > 0
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
          {blocks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Keine Einträge für diesen Monat</p>
          ) : (
            <div className="space-y-2">
              {blocks
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((block) => {
                  const netMin = block.net_minutes || 0
                  return (
                    <div key={block.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {format(new Date(block.date), "EEEE, dd.MM.yyyy", { locale: de })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {block.start_time?.slice(0, 5)} - {block.end_time ? block.end_time.slice(0, 5) : "offen"}
                          {block.break_minutes ? ` (${block.break_minutes} Min. Pause)` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{formatDuration(netMin)}</Badge>
                        {block.work_location && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {locationLabels[block.work_location] || block.work_location}
                          </p>
                        )}
                        {block.is_open && (
                          <Badge variant="outline" className="text-xs mt-1 text-orange-600 border-orange-300">
                            Aktiv
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

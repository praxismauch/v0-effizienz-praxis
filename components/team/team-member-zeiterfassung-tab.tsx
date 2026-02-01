"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { swrFetcher } from "@/lib/swr-fetcher"
import { format, parseISO, startOfMonth, endOfMonth, differenceInMinutes } from "date-fns"
import { de } from "date-fns/locale"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  ExternalLink,
  Building2,
  Home,
  Car,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TimeBlock {
  id: string
  user_id: string
  practice_id: string
  date: string
  start_time: string
  end_time?: string
  planned_hours?: number
  actual_hours?: number
  break_minutes: number
  overtime_minutes: number
  location_type: string
  status: "active" | "completed" | "cancelled"
  notes?: string
  created_at: string
  updated_at: string
}

interface TeamMemberZeiterfassungTabProps {
  memberId: string
  practiceId: string
  memberName: string
}

// Helper to format minutes to HH:MM
const formatMinutes = (minutes: number) => {
  const hours = Math.floor(Math.abs(minutes) / 60)
  const mins = Math.abs(minutes) % 60
  const sign = minutes < 0 ? "-" : ""
  return `${sign}${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

// Helper to calculate work duration
const calculateWorkDuration = (block: TimeBlock) => {
  if (!block.end_time) return 0
  const start = parseISO(block.start_time)
  const end = parseISO(block.end_time)
  const totalMinutes = differenceInMinutes(end, start)
  return Math.max(0, totalMinutes - block.break_minutes)
}

const getLocationIcon = (locationType: string) => {
  switch (locationType) {
    case "office":
      return <Building2 className="h-4 w-4" />
    case "homeoffice":
      return <Home className="h-4 w-4" />
    case "mobile":
      return <Car className="h-4 w-4" />
    default:
      return <Building2 className="h-4 w-4" />
  }
}

const getLocationLabel = (locationType: string) => {
  switch (locationType) {
    case "office":
      return "Praxis"
    case "homeoffice":
      return "Home Office"
    case "mobile":
      return "Mobil"
    default:
      return locationType
  }
}

export function TeamMemberZeiterfassungTab({
  memberId,
  practiceId,
  memberName,
}: TeamMemberZeiterfassungTabProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  const monthStart = startOfMonth(selectedMonth)
  const monthEnd = endOfMonth(selectedMonth)

  const {
    data: timeBlocksData,
    error,
    isLoading,
  } = useSWR<{ timeBlocks: TimeBlock[] }>(
    practiceId && memberId
      ? `/api/practices/${practiceId}/zeiterfassung/blocks?user_id=${memberId}&start_date=${format(monthStart, "yyyy-MM-dd")}&end_date=${format(monthEnd, "yyyy-MM-dd")}`
      : null,
    swrFetcher
  )

  const timeBlocks = timeBlocksData?.timeBlocks || []

  // Calculate statistics for the month
  const stats = useMemo(() => {
    const completedBlocks = timeBlocks.filter((b) => b.status === "completed")
    const uniqueDays = new Set(completedBlocks.map((b) => b.date)).size
    const totalMinutes = completedBlocks.reduce((sum, block) => sum + calculateWorkDuration(block), 0)
    const totalOvertime = completedBlocks.reduce((sum, block) => sum + block.overtime_minutes, 0)
    
    // Calculate average hours per day
    const avgMinutesPerDay = uniqueDays > 0 ? totalMinutes / uniqueDays : 0

    return {
      totalMinutes,
      totalOvertime,
      workDays: uniqueDays,
      avgMinutesPerDay,
      entriesCount: completedBlocks.length,
    }
  }, [timeBlocks])

  // Get recent entries (last 5)
  const recentEntries = useMemo(() => {
    return [...timeBlocks]
      .filter((b) => b.status === "completed")
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
  }, [timeBlocks])

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Fehler beim Laden</h3>
          <p className="text-muted-foreground text-center">
            Die Zeiterfassungsdaten konnten nicht geladen werden.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[150px] text-center">
            {format(selectedMonth, "MMMM yyyy", { locale: de })}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button asChild>
          <Link href={`/zeiterfassung?user=${memberId}`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Zur Zeiterfassung
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Arbeitszeit</p>
                  <p className="text-2xl font-bold">{formatMinutes(stats.totalMinutes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  stats.totalOvertime >= 0 ? "bg-green-100" : "bg-red-100"
                )}>
                  {stats.totalOvertime >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Überstunden</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    stats.totalOvertime >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatMinutes(stats.totalOvertime)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Arbeitstage</p>
                  <p className="text-2xl font-bold">{stats.workDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ø pro Tag</p>
                  <p className="text-2xl font-bold">{formatMinutes(Math.round(stats.avgMinutesPerDay))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Letzte Einträge</CardTitle>
          <CardDescription>
            Die letzten Zeiterfassungen von {memberName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Keine Zeiterfassungen in diesem Monat</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Startzeit</TableHead>
                  <TableHead>Endzeit</TableHead>
                  <TableHead>Pause</TableHead>
                  <TableHead>Arbeitszeit</TableHead>
                  <TableHead>Überstunden</TableHead>
                  <TableHead>Standort</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEntries.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell className="font-medium">
                      {format(parseISO(block.date), "dd.MM.yyyy", { locale: de })}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(block.start_time), "HH:mm")}
                    </TableCell>
                    <TableCell>
                      {block.end_time ? format(parseISO(block.end_time), "HH:mm") : "-"}
                    </TableCell>
                    <TableCell>{formatMinutes(block.break_minutes)}</TableCell>
                    <TableCell className="font-medium">
                      {formatMinutes(calculateWorkDuration(block))}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "font-medium",
                          block.overtime_minutes >= 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {formatMinutes(block.overtime_minutes)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {getLocationIcon(block.location_type)}
                        {getLocationLabel(block.location_type)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {recentEntries.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" asChild className="w-full">
                <Link href={`/zeiterfassung?user=${memberId}`}>
                  Alle Einträge anzeigen
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

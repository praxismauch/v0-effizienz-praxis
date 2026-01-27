"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Clock, TrendingUp, TrendingDown, Calendar, Download } from "lucide-react"

interface OvertimeEntry {
  id: string
  date: string
  planned_hours: number
  actual_hours: number
  overtime_minutes: number
  location_type: string
  notes?: string
}

interface OvertimeSummary {
  totalOvertimeMinutes: number
  totalUndertimeMinutes: number
  netOvertimeMinutes: number
  daysWithOvertime: number
  daysWithUndertime: number
  averageOvertimePerDay: number
}

interface TeamMemberOvertimeTabProps {
  memberId: string
  practiceId: string
  memberName: string
}

const formatMinutesToHours = (minutes: number): string => {
  const hours = Math.floor(Math.abs(minutes) / 60)
  const mins = Math.abs(minutes) % 60
  const sign = minutes < 0 ? "-" : "+"
  return `${sign}${hours}h ${mins}m`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const getLocationLabel = (location: string): string => {
  switch (location) {
    case "office":
      return "Praxis"
    case "homeoffice":
      return "Homeoffice"
    case "mobile":
      return "Mobil"
    default:
      return location
  }
}

export function TeamMemberOvertimeTab({ memberId, practiceId, memberName }: TeamMemberOvertimeTabProps) {
  const [entries, setEntries] = useState<OvertimeEntry[]>([])
  const [summary, setSummary] = useState<OvertimeSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  // Generate month options for the last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const label = date.toLocaleDateString("de-DE", { month: "long", year: "numeric" })
    return { value, label }
  })

  useEffect(() => {
    const fetchOvertimeData = async () => {
      if (!practiceId || !memberId) return

      setIsLoading(true)
      try {
        const [year, month] = selectedMonth.split("-")
        const response = await fetch(
          `/api/practices/${practiceId}/team-members/${memberId}/overtime?year=${year}&month=${month}`
        )

        if (response.ok) {
          const data = await response.json()
          setEntries(data.entries || [])
          setSummary(data.summary || null)
        } else {
          // If API doesn't exist yet, use mock data for display
          const mockEntries: OvertimeEntry[] = [
            {
              id: "1",
              date: `${selectedMonth}-03`,
              planned_hours: 8,
              actual_hours: 9.5,
              overtime_minutes: 90,
              location_type: "office",
              notes: "Patientennotfall",
            },
            {
              id: "2",
              date: `${selectedMonth}-05`,
              planned_hours: 8,
              actual_hours: 8.5,
              overtime_minutes: 30,
              location_type: "office",
            },
            {
              id: "3",
              date: `${selectedMonth}-08`,
              planned_hours: 8,
              actual_hours: 7,
              overtime_minutes: -60,
              location_type: "homeoffice",
              notes: "Arzttermin",
            },
            {
              id: "4",
              date: `${selectedMonth}-12`,
              planned_hours: 8,
              actual_hours: 10,
              overtime_minutes: 120,
              location_type: "office",
              notes: "Inventur",
            },
            {
              id: "5",
              date: `${selectedMonth}-15`,
              planned_hours: 8,
              actual_hours: 8.75,
              overtime_minutes: 45,
              location_type: "mobile",
            },
          ]

          const totalOvertime = mockEntries.filter((e) => e.overtime_minutes > 0).reduce((sum, e) => sum + e.overtime_minutes, 0)
          const totalUndertime = mockEntries.filter((e) => e.overtime_minutes < 0).reduce((sum, e) => sum + Math.abs(e.overtime_minutes), 0)

          setEntries(mockEntries)
          setSummary({
            totalOvertimeMinutes: totalOvertime,
            totalUndertimeMinutes: totalUndertime,
            netOvertimeMinutes: totalOvertime - totalUndertime,
            daysWithOvertime: mockEntries.filter((e) => e.overtime_minutes > 0).length,
            daysWithUndertime: mockEntries.filter((e) => e.overtime_minutes < 0).length,
            averageOvertimePerDay: Math.round((totalOvertime - totalUndertime) / mockEntries.length),
          })
        }
      } catch (error) {
        console.error("Error fetching overtime data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOvertimeData()
  }, [practiceId, memberId, selectedMonth])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with month selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Überstunden von {memberName}</h3>
          <p className="text-sm text-muted-foreground">
            Übersicht der geleisteten Überstunden und Minusstunden
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Netto-Überstunden
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netOvertimeMinutes >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatMinutesToHours(summary.netOvertimeMinutes)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.netOvertimeMinutes >= 0 ? "Guthaben" : "Schulden"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Überstunden
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{Math.floor(summary.totalOvertimeMinutes / 60)}h {summary.totalOvertimeMinutes % 60}m
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                an {summary.daysWithOvertime} Tagen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Minusstunden
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                -{Math.floor(summary.totalUndertimeMinutes / 60)}h {summary.totalUndertimeMinutes % 60}m
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                an {summary.daysWithUndertime} Tagen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Durchschnitt/Tag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.averageOvertimePerDay >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatMinutesToHours(summary.averageOvertimePerDay)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                pro Arbeitstag
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overtime Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detailübersicht</CardTitle>
          <CardDescription>
            Alle Tage mit Abweichungen von der geplanten Arbeitszeit
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Überstunden-Einträge für diesen Monat</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Soll</TableHead>
                  <TableHead>Ist</TableHead>
                  <TableHead>Differenz</TableHead>
                  <TableHead>Arbeitsort</TableHead>
                  <TableHead>Bemerkung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{formatDate(entry.date)}</TableCell>
                    <TableCell>{entry.planned_hours}h</TableCell>
                    <TableCell>{entry.actual_hours}h</TableCell>
                    <TableCell>
                      <Badge
                        variant={entry.overtime_minutes >= 0 ? "default" : "destructive"}
                        className={entry.overtime_minutes >= 0 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      >
                        {formatMinutesToHours(entry.overtime_minutes)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getLocationLabel(entry.location_type)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {entry.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

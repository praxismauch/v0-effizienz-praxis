"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, TrendingUp, TrendingDown, Download, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from "date-fns"
import { de } from "date-fns/locale"

interface TeamMemberOvertime {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
  overtime_total_minutes: number
  overtime_this_week_minutes: number
  overtime_this_month_minutes: number
  planned_hours_per_week: number
  actual_hours_this_week: number
  actual_hours_this_month: number
}

interface UeberstundenTabProps {
  practiceId: string
  isLoading?: boolean
}

// Format minutes to hours with sign
const formatOvertimeMinutes = (minutes: number) => {
  const h = Math.floor(Math.abs(minutes) / 60)
  const m = Math.abs(minutes) % 60
  const sign = minutes < 0 ? "-" : minutes > 0 ? "+" : ""
  return `${sign}${h}:${m.toString().padStart(2, "0")}`
}

// Format hours decimal to hours:minutes
const formatHours = (hours: number) => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}:${m.toString().padStart(2, "0")}`
}

export default function UeberstundenTab({ practiceId, isLoading = false }: UeberstundenTabProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberOvertime[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<"name" | "total" | "week" | "month">("total")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("all")

  // Fetch team members overtime data
  useState(() => {
    if (!practiceId) return

    const fetchOvertimeData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/practices/${practiceId}/overtime`)
        if (response.ok) {
          const data = await response.json()
          setTeamMembers(data.members || [])
        }
      } catch (error) {
        console.error("Error fetching overtime data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOvertimeData()
  }, [practiceId])

  // Sort team members
  const sortedMembers = useMemo(() => {
    const sorted = [...teamMembers]

    sorted.sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (sortBy) {
        case "name":
          aValue = `${a.last_name} ${a.first_name}`.toLowerCase()
          bValue = `${b.last_name} ${b.first_name}`.toLowerCase()
          break
        case "total":
          aValue = a.overtime_total_minutes
          bValue = b.overtime_total_minutes
          break
        case "week":
          aValue = a.overtime_this_week_minutes
          bValue = b.overtime_this_week_minutes
          break
        case "month":
          aValue = a.overtime_this_month_minutes
          bValue = b.overtime_this_month_minutes
          break
        default:
          aValue = a.overtime_total_minutes
          bValue = b.overtime_total_minutes
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return sortOrder === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
    })

    return sorted
  }, [teamMembers, sortBy, sortOrder])

  // Calculate totals
  const totals = useMemo(() => {
    return {
      total: sortedMembers.reduce((sum, m) => sum + m.overtime_total_minutes, 0),
      week: sortedMembers.reduce((sum, m) => sum + m.overtime_this_week_minutes, 0),
      month: sortedMembers.reduce((sum, m) => sum + m.overtime_this_month_minutes, 0),
    }
  }, [sortedMembers])

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting overtime data...")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Überstunden-Übersicht
            </CardTitle>
            <CardDescription>Überstundenstand aller Teammitglieder</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as typeof selectedPeriod)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Gesamt</SelectItem>
                <SelectItem value="month">Dieser Monat</SelectItem>
                <SelectItem value="week">Diese Woche</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gesamt Überstunden</p>
                  <p className="text-2xl font-bold">{formatOvertimeMinutes(totals.total)} h</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Diese Woche</p>
                  <p className="text-2xl font-bold">{formatOvertimeMinutes(totals.week)} h</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dieser Monat</p>
                  <p className="text-2xl font-bold">{formatOvertimeMinutes(totals.month)} h</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 font-semibold"
                    onClick={() => handleSort("name")}
                  >
                    Mitarbeiter
                    {sortBy === "name" && (sortOrder === "asc" ? " ↑" : " ↓")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 font-semibold"
                    onClick={() => handleSort("total")}
                  >
                    Gesamt
                    {sortBy === "total" && (sortOrder === "asc" ? " ↑" : " ↓")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 font-semibold"
                    onClick={() => handleSort("week")}
                  >
                    Diese Woche
                    {sortBy === "week" && (sortOrder === "asc" ? " ↑" : " ↓")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 font-semibold"
                    onClick={() => handleSort("month")}
                  >
                    Dieser Monat
                    {sortBy === "month" && (sortOrder === "asc" ? " ↑" : " ↓")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Soll/Woche</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {loading || isLoading ? "Daten werden geladen..." : "Keine Daten verfügbar"}
                  </TableCell>
                </TableRow>
              ) : (
                sortedMembers.map((member) => {
                  const overtimeValue =
                    selectedPeriod === "week"
                      ? member.overtime_this_week_minutes
                      : selectedPeriod === "month"
                        ? member.overtime_this_month_minutes
                        : member.overtime_total_minutes

                  const isPositive = overtimeValue > 0
                  const isNegative = overtimeValue < 0

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {member.first_name?.[0]}
                              {member.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {member.first_name} {member.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-semibold",
                            member.overtime_total_minutes > 0
                              ? "text-green-600"
                              : member.overtime_total_minutes < 0
                                ? "text-red-600"
                                : "text-muted-foreground",
                          )}
                        >
                          {formatOvertimeMinutes(member.overtime_total_minutes)} h
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-medium",
                            member.overtime_this_week_minutes > 0
                              ? "text-green-600"
                              : member.overtime_this_week_minutes < 0
                                ? "text-red-600"
                                : "text-muted-foreground",
                          )}
                        >
                          {formatOvertimeMinutes(member.overtime_this_week_minutes)} h
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-medium",
                            member.overtime_this_month_minutes > 0
                              ? "text-green-600"
                              : member.overtime_this_month_minutes < 0
                                ? "text-red-600"
                                : "text-muted-foreground",
                          )}
                        >
                          {formatOvertimeMinutes(member.overtime_this_month_minutes)} h
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatHours(member.planned_hours_per_week || 40)} h
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={isPositive ? "default" : isNegative ? "destructive" : "secondary"}
                          className="gap-1"
                        >
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : isNegative ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : null}
                          {isPositive ? "Über" : isNegative ? "Unter" : "Neutral"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

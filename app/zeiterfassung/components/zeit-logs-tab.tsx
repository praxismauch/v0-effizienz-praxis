"use client"

import { useState, useMemo } from "react"
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns"
import { de } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  Edit, 
  Trash2, 
  Search, 
  Calendar, 
  Users,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type TimeBlock, type TeamMember, type Team, formatMinutes, calculateWorkDuration } from "../lib/time-helpers"
import { WeeklyStatsCard } from "./weekly-stats-card"
import { TeamStatsCard } from "./team-stats-card"

interface ZeitLogsTabProps {
  timeBlocks: TimeBlock[]
  teamMembers: TeamMember[]
  teams: Team[]
  isLoading: boolean
  selectedMonth: Date
  onMonthChange: (date: Date) => void
  onEditBlock?: (block: TimeBlock) => void
  onDeleteBlock?: (blockId: string) => void
}

export default function ZeitLogsTab({
  timeBlocks,
  teamMembers,
  teams,
  isLoading,
  selectedMonth,
  onMonthChange,
  onEditBlock,
  onDeleteBlock,
}: ZeitLogsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

  // Filter blocks based on search and filters
  const filteredBlocks = useMemo(() => {
    let filtered = [...timeBlocks]

    // Filter by user
    if (selectedUser !== "all") {
      filtered = filtered.filter((block) => block.user_id === selectedUser)
    }

    // Filter by team
    if (selectedTeam !== "all") {
      const teamMemberIds = teamMembers
        .filter((member) => member.team_ids?.includes(selectedTeam))
        .map((member) => member.user_id)
      filtered = filtered.filter((block) => teamMemberIds.includes(block.user_id))
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((block) => {
        const member = teamMembers.find((m) => m.user_id === block.user_id)
        const memberName = member
          ? `${member.first_name} ${member.last_name}`.toLowerCase()
          : ""
        const notes = block.notes?.toLowerCase() || ""
        return memberName.includes(query) || notes.includes(query)
      })
    }

    return filtered.sort((a, b) => {
      // Sort by date DESC, then by start_time DESC
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return b.start_time.localeCompare(a.start_time)
    })
  }, [timeBlocks, selectedUser, selectedTeam, searchQuery, teamMembers])

  // Calculate statistics per user
  const userStats = useMemo(() => {
    const stats = new Map<
      string,
      {
        userId: string
        name: string
        totalMinutes: number
        overtimeMinutes: number
        daysWorked: number
        blocks: TimeBlock[]
      }
    >()

    filteredBlocks.forEach((block) => {
      const member = teamMembers.find((m) => m.user_id === block.user_id)
      const name = member
        ? `${member.first_name} ${member.last_name}`
        : "Unbekannt"

      if (!stats.has(block.user_id)) {
        stats.set(block.user_id, {
          userId: block.user_id,
          name,
          totalMinutes: 0,
          overtimeMinutes: 0,
          daysWorked: new Set<string>().size,
          blocks: [],
        })
      }

      const userStat = stats.get(block.user_id)!
      userStat.blocks.push(block)
      userStat.totalMinutes += calculateWorkDuration(block)
      userStat.overtimeMinutes += block.overtime_minutes
    })

    // Calculate days worked
    stats.forEach((stat) => {
      const uniqueDays = new Set(stat.blocks.map((b) => b.date))
      stat.daysWorked = uniqueDays.size
    })

    return Array.from(stats.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredBlocks, teamMembers])

  // Calculate statistics per day
  const dailyStats = useMemo(() => {
    const stats = new Map<
      string,
      {
        date: string
        totalMinutes: number
        overtimeMinutes: number
        usersWorked: number
      }
    >()

    filteredBlocks.forEach((block) => {
      if (!stats.has(block.date)) {
        stats.set(block.date, {
          date: block.date,
          totalMinutes: 0,
          overtimeMinutes: 0,
          usersWorked: 0,
        })
      }

      const dayStat = stats.get(block.date)!
      dayStat.totalMinutes += calculateWorkDuration(block)
      dayStat.overtimeMinutes += block.overtime_minutes
    })

    // Calculate unique users per day
    filteredBlocks.forEach((block) => {
      const dayStat = stats.get(block.date)
      if (dayStat) {
        const usersOnDay = new Set(
          filteredBlocks.filter((b) => b.date === block.date).map((b) => b.user_id)
        )
        dayStat.usersWorked = usersOnDay.size
      }
    })

    return Array.from(stats.values()).sort((a, b) => b.date.localeCompare(a.date))
  }, [filteredBlocks])

  // Calculate statistics per week
  const weeklyStats = useMemo(() => {
    const stats = new Map<
      string,
      {
        weekStart: Date
        weekEnd: Date
        totalMinutes: number
        overtimeMinutes: number
        daysWorked: number
      }
    >()

    filteredBlocks.forEach((block) => {
      const blockDate = parseISO(block.date)
      const weekStart = startOfWeek(blockDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(blockDate, { weekStartsOn: 1 })
      const weekKey = format(weekStart, "yyyy-MM-dd")

      if (!stats.has(weekKey)) {
        stats.set(weekKey, {
          weekStart,
          weekEnd,
          totalMinutes: 0,
          overtimeMinutes: 0,
          daysWorked: 0,
        })
      }

      const weekStat = stats.get(weekKey)!
      weekStat.totalMinutes += calculateWorkDuration(block)
      weekStat.overtimeMinutes += block.overtime_minutes
    })

    // Calculate days worked per week
    stats.forEach((stat, weekKey) => {
      const daysInWeek = new Set(
        filteredBlocks
          .filter((block) => {
            const blockDate = parseISO(block.date)
            const blockWeekStart = startOfWeek(blockDate, { weekStartsOn: 1 })
            return format(blockWeekStart, "yyyy-MM-dd") === weekKey
          })
          .map((block) => block.date)
      )
      stat.daysWorked = daysInWeek.size
    })

    return Array.from(stats.values()).sort((a, b) => 
      b.weekStart.getTime() - a.weekStart.getTime()
    )
  }, [filteredBlocks])

  // Calculate team statistics
  const teamStats = useMemo(() => {
    const stats = new Map<
      string,
      {
        teamId: string
        teamName: string
        teamColor: string
        totalMinutes: number
        overtimeMinutes: number
        memberCount: number
      }
    >()

    teams.forEach((team) => {
      stats.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        totalMinutes: 0,
        overtimeMinutes: 0,
        memberCount: 0,
      })
    })

    filteredBlocks.forEach((block) => {
      const member = teamMembers.find((m) => m.user_id === block.user_id)
      if (member?.team_ids) {
        member.team_ids.forEach((teamId) => {
          const teamStat = stats.get(teamId)
          if (teamStat) {
            teamStat.totalMinutes += calculateWorkDuration(block)
            teamStat.overtimeMinutes += block.overtime_minutes
          }
        })
      }
    })

    // Calculate unique members per team
    stats.forEach((stat) => {
      const membersInTeam = new Set(
        teamMembers
          .filter((member) => member.team_ids?.includes(stat.teamId))
          .filter((member) =>
            filteredBlocks.some((block) => block.user_id === member.user_id)
          )
          .map((member) => member.user_id)
      )
      stat.memberCount = membersInTeam.size
    })

    return Array.from(stats.values()).sort((a, b) => a.teamName.localeCompare(b.teamName))
  }, [filteredBlocks, teamMembers, teams])

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <CardTitle>Zeit-Logs</CardTitle>
          <CardDescription>
            Übersicht und Verwaltung aller Zeiterfassungen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and filters */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Suche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Name oder Notizen suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mitarbeiter</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Mitarbeiter" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[300px]">
                  <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                  {teamMembers.map((member) => {
                    const memberId = member.user_id || member.id || member.team_member_id
                    if (!memberId) return null
                    return (
                      <SelectItem key={memberId} value={memberId}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        {team.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Arbeitszeit</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMinutes(userStats.reduce((sum, stat) => sum + stat.totalMinutes, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredBlocks.length} Einträge
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Überstunden</CardTitle>
            {userStats.reduce((sum, stat) => sum + stat.overtimeMinutes, 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                userStats.reduce((sum, stat) => sum + stat.overtimeMinutes, 0) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              )}
            >
              {formatMinutes(userStats.reduce((sum, stat) => sum + stat.overtimeMinutes, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Gesamt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mitarbeiter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.length}</div>
            <p className="text-xs text-muted-foreground">Aktive Nutzer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arbeitstage</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats.length}</div>
            <p className="text-xs text-muted-foreground">Im ausgewählten Zeitraum</p>
          </CardContent>
        </Card>
      </div>

      {/* User statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Übersicht pro Mitarbeiter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {userStats.map((stat) => (
              <div key={stat.userId} className="space-y-2">
                <div
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() =>
                    setExpandedUserId(expandedUserId === stat.userId ? null : stat.userId)
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      {stat.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="font-medium">{stat.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {stat.daysWorked} Arbeitstage
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatMinutes(stat.totalMinutes)}</div>
                      <div className="text-xs text-muted-foreground">Arbeitszeit</div>
                    </div>
                    <div className="text-right">
                      <div
                        className={cn(
                          "text-sm font-medium",
                          stat.overtimeMinutes >= 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {formatMinutes(stat.overtimeMinutes)}
                      </div>
                      <div className="text-xs text-muted-foreground">Überstunden</div>
                    </div>
                    {expandedUserId === stat.userId ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded view with daily breakdown */}
                {expandedUserId === stat.userId && (
                  <div className="ml-4 space-y-1 rounded-lg border bg-muted/30 p-4">
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
                          <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stat.blocks.map((block) => (
                          <TableRow key={block.id}>
                            <TableCell>
                              {format(parseISO(block.date), "EE, dd.MM.yyyy", { locale: de })}
                            </TableCell>
                            <TableCell>
                              {format(parseISO(block.start_time), "HH:mm")}
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1.5">
                                {block.end_time
                                  ? format(parseISO(block.end_time), "HH:mm")
                                  : "-"}
                                {block.auto_stopped && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 text-amber-600 border-amber-300">
                                    Auto
                                  </Badge>
                                )}
                              </span>
                            </TableCell>
                            <TableCell>{formatMinutes(block.break_minutes)}</TableCell>
                            <TableCell className="font-medium">
                              {formatMinutes(calculateWorkDuration(block))}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "font-medium",
                                  block.overtime_minutes >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                )}
                              >
                                {formatMinutes(block.overtime_minutes)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{block.location_type}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {onEditBlock && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEditBlock(block)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {onDeleteBlock && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDeleteBlock(block.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <WeeklyStatsCard weeklyStats={weeklyStats} />
      <TeamStatsCard teamStats={teamStats} />
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Clock, Search, Calendar, Users, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { type TimeBlock, type TeamMember, type Team, formatMinutes } from "../lib/time-helpers"
import { TeamMemberSelectItem } from "@/components/team-member-select-item"
import { WeeklyStatsCard } from "./weekly-stats-card"
import { TeamStatsCard } from "./team-stats-card"
import { UserStatsRow } from "./user-stats-row"
import { useZeitLogsStats } from "../hooks/use-zeit-logs-stats"

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

  const { filteredBlocks, userStats, dailyStats, weeklyStats, teamStats } = useZeitLogsStats({
    timeBlocks,
    teamMembers,
    teams,
    searchQuery,
    selectedUser,
    selectedTeam,
  })

  const totalWorkMinutes = userStats.reduce((sum, stat) => sum + stat.totalMinutes, 0)
  const totalOvertimeMinutes = userStats.reduce((sum, stat) => sum + stat.overtimeMinutes, 0)

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <CardTitle>Zeit-Logs</CardTitle>
          <CardDescription>
            {"Übersicht und Verwaltung aller Zeiterfassungen"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                      <TeamMemberSelectItem
                        key={memberId}
                        value={memberId}
                        firstName={member.first_name}
                        lastName={member.last_name}
                        avatarUrl={member.avatar_url}
                      />
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
            <div className="text-2xl font-bold">{formatMinutes(totalWorkMinutes)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredBlocks.length} {"Einträge"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{"Überstunden"}</CardTitle>
            {totalOvertimeMinutes >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", totalOvertimeMinutes >= 0 ? "text-green-600" : "text-red-600")}>
              {formatMinutes(totalOvertimeMinutes)}
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
            <p className="text-xs text-muted-foreground">{"Im ausgewählten Zeitraum"}</p>
          </CardContent>
        </Card>
      </div>

      {/* User statistics */}
      <Card>
        <CardHeader>
          <CardTitle>{"Übersicht pro Mitarbeiter"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {userStats.map((stat) => (
              <UserStatsRow
                key={stat.userId}
                stat={stat}
                isExpanded={expandedUserId === stat.userId}
                onToggle={() => setExpandedUserId(expandedUserId === stat.userId ? null : stat.userId)}
                onEditBlock={onEditBlock}
                onDeleteBlock={onDeleteBlock}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <WeeklyStatsCard weeklyStats={weeklyStats} />
      <TeamStatsCard teamStats={teamStats} />
    </div>
  )
}

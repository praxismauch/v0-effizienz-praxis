"use client"

import { useMemo } from "react"
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns"
import { type TimeBlock, type TeamMember, type Team, calculateWorkDuration } from "../lib/time-helpers"

export interface UserStat {
  userId: string
  name: string
  totalMinutes: number
  overtimeMinutes: number
  daysWorked: number
  blocks: TimeBlock[]
}

export interface DayStat {
  date: string
  totalMinutes: number
  overtimeMinutes: number
  usersWorked: number
}

export interface WeekStat {
  weekStart: Date
  weekEnd: Date
  totalMinutes: number
  overtimeMinutes: number
  daysWorked: number
}

export interface TeamStat {
  teamId: string
  teamName: string
  teamColor: string
  totalMinutes: number
  overtimeMinutes: number
  memberCount: number
}

interface UseZeitLogsStatsParams {
  timeBlocks: TimeBlock[]
  teamMembers: TeamMember[]
  teams: Team[]
  searchQuery: string
  selectedUser: string
  selectedTeam: string
}

export function useZeitLogsStats({
  timeBlocks,
  teamMembers,
  teams,
  searchQuery,
  selectedUser,
  selectedTeam,
}: UseZeitLogsStatsParams) {
  // Filter blocks based on search and filters
  const filteredBlocks = useMemo(() => {
    let filtered = [...timeBlocks]

    if (selectedUser !== "all") {
      filtered = filtered.filter((block) => block.user_id === selectedUser)
    }

    if (selectedTeam !== "all") {
      const teamMemberIds = teamMembers
        .filter((member) => member.team_ids?.includes(selectedTeam))
        .map((member) => member.user_id)
      filtered = filtered.filter((block) => teamMemberIds.includes(block.user_id))
    }

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
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return b.start_time.localeCompare(a.start_time)
    })
  }, [timeBlocks, selectedUser, selectedTeam, searchQuery, teamMembers])

  // Calculate statistics per user
  const userStats = useMemo<UserStat[]>(() => {
    const stats = new Map<string, UserStat>()

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
          daysWorked: 0,
          blocks: [],
        })
      }

      const userStat = stats.get(block.user_id)!
      userStat.blocks.push(block)
      userStat.totalMinutes += calculateWorkDuration(block)
      userStat.overtimeMinutes += block.overtime_minutes
    })

    stats.forEach((stat) => {
      const uniqueDays = new Set(stat.blocks.map((b) => b.date))
      stat.daysWorked = uniqueDays.size
    })

    return Array.from(stats.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredBlocks, teamMembers])

  // Calculate statistics per day
  const dailyStats = useMemo<DayStat[]>(() => {
    const stats = new Map<string, DayStat>()

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
  const weeklyStats = useMemo<WeekStat[]>(() => {
    const stats = new Map<
      string,
      WeekStat
    >()

    filteredBlocks.forEach((block) => {
      const blockDate = parseISO(block.date)
      const ws = startOfWeek(blockDate, { weekStartsOn: 1 })
      const we = endOfWeek(blockDate, { weekStartsOn: 1 })
      const weekKey = format(ws, "yyyy-MM-dd")

      if (!stats.has(weekKey)) {
        stats.set(weekKey, {
          weekStart: ws,
          weekEnd: we,
          totalMinutes: 0,
          overtimeMinutes: 0,
          daysWorked: 0,
        })
      }

      const weekStat = stats.get(weekKey)!
      weekStat.totalMinutes += calculateWorkDuration(block)
      weekStat.overtimeMinutes += block.overtime_minutes
    })

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
  const teamStats = useMemo<TeamStat[]>(() => {
    const stats = new Map<string, TeamStat>()

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

  return { filteredBlocks, userStats, dailyStats, weeklyStats, teamStats }
}

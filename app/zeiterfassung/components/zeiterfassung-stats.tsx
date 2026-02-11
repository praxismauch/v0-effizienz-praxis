"use client"

import { format } from "date-fns"
import { Timer, CalendarCheck, AlertTriangle, Users } from "lucide-react"
import { StatCard, statCardColors } from "@/components/ui/stat-card"

interface ZeiterfassungStatsProps {
  currentBlock: any
  timeBlocks: any[]
  correctionRequests: any[]
  teamMembers: any[]
}

export function ZeiterfassungStats({
  currentBlock,
  timeBlocks,
  correctionRequests,
  teamMembers,
}: ZeiterfassungStatsProps) {
  const today = format(new Date(), "yyyy-MM-dd")

  // Today's completed work from blocks (using actual_hours, same as stechuhr-tab)
  const todayCompletedMinutes = timeBlocks
    .filter((b) => b.date === today)
    .reduce((sum, b) => sum + (b.actual_hours ? b.actual_hours * 60 : 0), 0)

  // Active session minutes
  const activeMinutes =
    currentBlock && !currentBlock.end_time
      ? Math.floor((Date.now() - new Date(currentBlock.start_time).getTime()) / 60000)
      : 0

  const todayTotalMinutes = Math.round(todayCompletedMinutes + activeMinutes)
  const todayH = Math.floor(todayTotalMinutes / 60)
  const todayM = todayTotalMinutes % 60

  // Monthly totals (using actual_hours)
  const monthMinutes = Math.round(
    timeBlocks.reduce((sum, b) => sum + (b.actual_hours ? b.actual_hours * 60 : 0), 0)
  )
  const monthH = Math.floor(monthMinutes / 60)
  const monthM = monthMinutes % 60

  const isActive = currentBlock && !currentBlock.end_time

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <StatCard
        label="Heute"
        value={`${todayH}h ${todayM}min`}
        icon={Timer}
        {...statCardColors.info}
        description={isActive ? "Aktiv" : "Arbeitszeit"}
        descriptionColor={isActive ? "text-green-600" : undefined}
      />
      <StatCard
        label="Diesen Monat"
        value={`${monthH}h ${monthM}min`}
        icon={CalendarCheck}
        {...statCardColors.success}
        description={`${timeBlocks.length} Eintraege`}
      />
      <StatCard
        label="Korrekturen"
        value={correctionRequests.filter((c) => c.status === "pending").length}
        icon={AlertTriangle}
        {...statCardColors.warning}
        description="offen"
      />
      <StatCard
        label="Team aktiv"
        value={teamMembers.filter((m) => m.is_clocked_in || m.status === "active").length}
        icon={Users}
        {...statCardColors.purple}
        description={`von ${teamMembers.length} Mitarbeitern`}
      />
    </div>
  )
}

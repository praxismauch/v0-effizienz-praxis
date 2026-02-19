"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatMinutes } from "../lib/time-helpers"

interface TeamStat {
  teamId: string
  teamName: string
  teamColor: string
  totalMinutes: number
  overtimeMinutes: number
  memberCount: number
}

interface TeamStatsCardProps {
  teamStats: TeamStat[]
}

export function TeamStatsCard({ teamStats }: TeamStatsCardProps) {
  if (teamStats.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team-Uebersicht</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Aktive Mitarbeiter</TableHead>
              <TableHead>Gesamt Arbeitszeit</TableHead>
              <TableHead>Ueberstunden</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamStats.map((stat) => (
              <TableRow key={stat.teamId}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stat.teamColor }} />
                    <span className="font-medium">{stat.teamName}</span>
                  </div>
                </TableCell>
                <TableCell>{stat.memberCount}</TableCell>
                <TableCell className="font-medium">
                  {formatMinutes(stat.totalMinutes)}
                </TableCell>
                <TableCell>
                  <span className={cn("font-medium", stat.overtimeMinutes >= 0 ? "text-green-600" : "text-red-600")}>
                    {formatMinutes(stat.overtimeMinutes)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

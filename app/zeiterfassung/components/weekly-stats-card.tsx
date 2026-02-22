"use client"

import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatMinutes } from "../lib/time-helpers"

interface WeeklyStat {
  weekStart: Date
  weekEnd: Date
  totalMinutes: number
  overtimeMinutes: number
  daysWorked: number
}

interface WeeklyStatsCardProps {
  weeklyStats: WeeklyStat[]
}

export function WeeklyStatsCard({ weeklyStats }: WeeklyStatsCardProps) {
  if (weeklyStats.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wochenübersicht</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Woche</TableHead>
              <TableHead>Arbeitstage</TableHead>
              <TableHead>Gesamt Arbeitszeit</TableHead>
              <TableHead>Überstunden</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeklyStats.map((stat) => (
              <TableRow key={format(stat.weekStart, "yyyy-MM-dd")}>
                <TableCell>
                  {format(stat.weekStart, "dd.MM.yyyy", { locale: de })} -{" "}
                  {format(stat.weekEnd, "dd.MM.yyyy", { locale: de })}
                </TableCell>
                <TableCell>{stat.daysWorked}</TableCell>
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

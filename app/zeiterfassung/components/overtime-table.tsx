"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatOvertimeMinutes, formatHours, type TeamMemberOvertime } from "./overtime-utils"

interface OvertimeTableProps {
  members: TeamMemberOvertime[]
  loading: boolean
  selectedPeriod: "week" | "month" | "all"
  sortBy: "name" | "total" | "week" | "month"
  sortOrder: "asc" | "desc"
  onSort: (field: "name" | "total" | "week" | "month") => void
}

export function OvertimeTable({ members, loading, selectedPeriod, sortBy, sortOrder, onSort }: OvertimeTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">
              <Button variant="ghost" size="sm" className="h-8 font-semibold" onClick={() => onSort("name")}>
                Mitarbeiter
                {sortBy === "name" && (sortOrder === "asc" ? " \u2191" : " \u2193")}
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" size="sm" className="h-8 font-semibold" onClick={() => onSort("total")}>
                Gesamt
                {sortBy === "total" && (sortOrder === "asc" ? " \u2191" : " \u2193")}
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" size="sm" className="h-8 font-semibold" onClick={() => onSort("week")}>
                Diese Woche
                {sortBy === "week" && (sortOrder === "asc" ? " \u2191" : " \u2193")}
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" size="sm" className="h-8 font-semibold" onClick={() => onSort("month")}>
                Dieser Monat
                {sortBy === "month" && (sortOrder === "asc" ? " \u2191" : " \u2193")}
              </Button>
            </TableHead>
            <TableHead className="text-right">Soll/Woche</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                {loading ? "Daten werden geladen..." : "Keine Daten verfügbar"}
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => {
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
                        <AvatarFallback>{member.first_name?.[0]}{member.last_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.first_name} {member.last_name}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn("font-semibold", member.overtime_total_minutes > 0 ? "text-green-600" : member.overtime_total_minutes < 0 ? "text-red-600" : "text-muted-foreground")}>
                      {formatOvertimeMinutes(member.overtime_total_minutes)} h
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn("font-medium", member.overtime_this_week_minutes > 0 ? "text-green-600" : member.overtime_this_week_minutes < 0 ? "text-red-600" : "text-muted-foreground")}>
                      {formatOvertimeMinutes(member.overtime_this_week_minutes)} h
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn("font-medium", member.overtime_this_month_minutes > 0 ? "text-green-600" : member.overtime_this_month_minutes < 0 ? "text-red-600" : "text-muted-foreground")}>
                      {formatOvertimeMinutes(member.overtime_this_month_minutes)} h
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatHours(member.planned_hours_per_week || 40)} h
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={isPositive ? "default" : isNegative ? "destructive" : "secondary"} className="gap-1">
                      {isPositive ? <TrendingUp className="h-3 w-3" /> : isNegative ? <TrendingDown className="h-3 w-3" /> : null}
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
  )
}

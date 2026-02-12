"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  TrendingUp,
  AlertTriangle,
  ListTodo,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TodoStats {
  total: number
  offen: number
  in_bearbeitung: number
  erledigt: number
  abgebrochen: number
}

interface TodoStatsHeaderProps {
  stats: TodoStats
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  overdueCount: number
}

function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 6,
}: {
  percentage: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
        className="stroke-muted"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        className="stroke-primary transition-all duration-700 ease-out"
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: offset,
        }}
      />
    </svg>
  )
}

export function TodoStatsHeader({
  stats,
  statusFilter,
  onStatusFilterChange,
  overdueCount,
}: TodoStatsHeaderProps) {
  const completionPercentage =
    stats.total > 0 ? Math.round((stats.erledigt / stats.total) * 100) : 0

  const statCards = [
    {
      key: "alle",
      label: "Gesamt",
      value: stats.total,
      icon: ListTodo,
      color: "text-foreground",
      bgColor: "bg-secondary/50",
      borderColor: "border-border",
      activeColor: "bg-primary text-primary-foreground",
    },
    {
      key: "offen",
      label: "Offen",
      value: stats.offen,
      icon: Circle,
      color: "text-primary",
      bgColor: "bg-primary/5",
      borderColor: "border-primary/20",
      activeColor: "bg-primary text-primary-foreground",
    },
    {
      key: "in_bearbeitung",
      label: "In Bearbeitung",
      value: stats.in_bearbeitung,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/5",
      borderColor: "border-warning/20",
      activeColor: "bg-warning text-warning-foreground",
    },
    {
      key: "erledigt",
      label: "Erledigt",
      value: stats.erledigt,
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/5",
      borderColor: "border-success/20",
      activeColor: "bg-success text-success-foreground",
    },
    {
      key: "abgebrochen",
      label: "Abgebrochen",
      value: stats.abgebrochen,
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/5",
      borderColor: "border-destructive/20",
      activeColor: "bg-destructive text-destructive-foreground",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero summary card */}
      <Card className="border-none bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Aufgaben
              </h1>
              <p className="text-sm text-muted-foreground">
                Verwalten und organisieren Sie Ihre Aufgaben effizient
              </p>
              <div className="flex items-center gap-3 pt-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-foreground">
                    {completionPercentage}% erledigt
                  </span>
                </div>
                {overdueCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="gap-1"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {overdueCount} uberfällig
                  </Badge>
                )}
                {stats.in_bearbeitung > 0 && (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-warning/10 text-warning border-warning/20"
                  >
                    <Clock className="h-3 w-3" />
                    {stats.in_bearbeitung} aktiv
                  </Badge>
                )}
              </div>
            </div>
            <div className="relative flex-shrink-0 hidden sm:flex items-center justify-center">
              <ProgressRing percentage={completionPercentage} size={88} strokeWidth={7} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-lg font-bold text-foreground">
                    {completionPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat cards row */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon
          const isActive = statusFilter === stat.key

          return (
            <button
              key={stat.key}
              onClick={() => onStatusFilterChange(stat.key)}
              className={cn(
                "group relative overflow-hidden rounded-lg border p-4 text-left transition-all duration-200",
                "hover:shadow-md hover:-translate-y-0.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                    isActive ? "bg-primary/10" : stat.bgColor
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-primary" : stat.color
                    )}
                  />
                </div>
                {isActive && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                {stat.label}
              </p>
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

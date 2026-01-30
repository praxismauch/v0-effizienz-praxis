"use client"

import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StatItem {
  label: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
  description?: string
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
}

interface StatsCardProps {
  stat: StatItem
  className?: string
}

export function StatsCard({ stat, className }: StatsCardProps) {
  const Icon = stat.icon
  const iconColor = stat.iconColor || "text-blue-600"
  const iconBgColor = stat.iconBgColor || "bg-blue-100"

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", iconBgColor)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            {stat.description && (
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            )}
            {stat.trend && (
              <div className="flex items-center gap-1 mt-1">
                <span
                  className={cn(
                    "text-xs font-medium",
                    stat.trend.isPositive ? "text-green-600" : "text-red-600",
                  )}
                >
                  {stat.trend.isPositive ? "↑" : "↓"} {Math.abs(stat.trend.value)}%
                </span>
                <span className="text-xs text-muted-foreground">{stat.trend.label}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface StatsGridProps {
  stats: StatItem[]
  columns?: 2 | 3 | 4
  className?: string
}

export function StatsGrid({ stats, columns = 4, className }: StatsGridProps) {
  const gridClass = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[columns]

  return (
    <div className={cn("grid gap-4", gridClass, className)}>
      {stats.map((stat, index) => (
        <StatsCard key={index} stat={stat} />
      ))}
    </div>
  )
}

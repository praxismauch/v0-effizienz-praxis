"use client"

import { StatCard as UIStatCard, type StatCardProps as UIStatCardProps } from "@/components/ui/stat-card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

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
  return (
    <UIStatCard
      label={stat.label}
      value={stat.value}
      icon={stat.icon}
      iconColor={stat.iconColor || "text-blue-600"}
      iconBgColor={stat.iconBgColor || "bg-blue-500/10"}
      description={stat.description}
      trend={stat.trend ? { value: stat.trend.value, label: stat.trend.label, positive: stat.trend.isPositive } : undefined}
      className={className}
    />
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

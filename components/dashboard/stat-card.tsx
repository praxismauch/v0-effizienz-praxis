"use client"

import { memo } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"

interface StatCardProps {
  title: string
  value: number | string
  trend?: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  href: string
  subtitle?: string
}

const colorClasses: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  purple: "bg-purple-50 text-purple-600",
  amber: "bg-amber-50 text-amber-600",
  pink: "bg-pink-50 text-pink-600",
  orange: "bg-orange-50 text-orange-600",
  gray: "bg-gray-50 text-gray-600",
  teal: "bg-teal-50 text-teal-600",
  indigo: "bg-indigo-50 text-indigo-600",
  red: "bg-red-50 text-red-600",
  yellow: "bg-yellow-50 text-yellow-600",
}

export const StatCard = memo(function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  color,
  href,
  subtitle,
}: StatCardProps) {
  return (
    <Link href={href}>
      <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClasses[color] || colorClasses.blue}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={trend >= 0 ? "text-green-500" : "text-red-500"}>{Math.abs(trend)}%</span>
            <span className="text-muted-foreground">vs letzte Woche</span>
          </div>
        )}
      </Card>
    </Link>
  )
})

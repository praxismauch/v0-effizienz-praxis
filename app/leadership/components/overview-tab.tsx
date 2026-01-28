"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { LeadershipMetric } from "../types"

interface OverviewTabProps {
  metrics: LeadershipMetric[]
}

export default function OverviewTab({ metrics }: OverviewTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {metric.icon}
              {metric.trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
              {metric.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
              {metric.trend === "stable" && <Minus className="h-4 w-4 text-gray-500" />}
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{metric.value}%</div>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <Progress value={metric.value} className="mt-2" />
              <p className="mt-1 text-xs text-muted-foreground">Ziel: {metric.target}%</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

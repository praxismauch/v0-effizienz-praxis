"use client"

import { memo } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Clock, CheckSquare, CalendarDays, Activity } from "lucide-react"
import { BarChart, LineChart, AreaChart } from "./charts"

interface WeeklyTasksData {
  day: string
  completed: number
  pending: number
}

interface TodayScheduleData {
  time: string
  appointments: number
}

interface ActivityData {
  date: string
  value: number
}

interface RecentActivity {
  id: string
  title: string
  description: string
  timestamp: string
  priority: string
}

export const WeeklyTasksWidget = memo(function WeeklyTasksWidget({ data }: { data: WeeklyTasksData[] }) {
  return (
    <Card className="p-5 border-muted col-span-full">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Wöchentliche Aufgaben</p>
            <p className="text-xs text-muted-foreground mt-0.5">Erledigte und ausstehende Aufgaben diese Woche</p>
          </div>
        </div>
        <BarChart data={data} />
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded" />
            <span className="text-muted-foreground">Erledigt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-muted rounded" />
            <span className="text-muted-foreground">Ausstehend</span>
          </div>
        </div>
      </div>
    </Card>
  )
})

export const TodayScheduleWidget = memo(function TodayScheduleWidget({ data }: { data: TodayScheduleData[] }) {
  return (
    <Card className="p-5 border-muted col-span-full">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Heutiger Terminplan</p>
            <p className="text-xs text-muted-foreground mt-0.5">Verteilung der Termine über den Tag</p>
          </div>
        </div>
        <LineChart data={data} />
      </div>
    </Card>
  )
})

export const ActivityChartWidget = memo(function ActivityChartWidget({ data }: { data: ActivityData[] }) {
  return (
    <Card className="p-5 border-muted col-span-full">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Aktivität</p>
            <p className="text-xs text-muted-foreground mt-0.5">Praxisaktivität der letzten 7 Tage</p>
          </div>
        </div>
        <AreaChart data={data} />
      </div>
    </Card>
  )
})

export const KPIWidget = memo(function KPIWidget({ 
  kpiScore, 
  kpiTrend 
}: { 
  kpiScore?: number
  kpiTrend?: number 
}) {
  const score = kpiScore || 85
  const trend = kpiTrend || 5

  return (
    <Card className="p-5 hover:shadow-md transition-shadow h-full min-h-[140px]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">Praxis-Score</p>
          <p className="text-3xl font-bold tracking-tight mt-1">{score}</p>
          <p className="text-xs text-muted-foreground mt-0.5">von 100 Punkten</p>
        </div>
      </div>
      {trend !== 0 && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={trend >= 0 ? "text-green-500" : "text-red-500"}>
            {Math.abs(trend)}%
          </span>
          <span className="text-muted-foreground">vs letzte Woche</span>
        </div>
      )}
    </Card>
  )
})

export const RecentActivitiesWidget = memo(function RecentActivitiesWidget({ 
  activities 
}: { 
  activities: RecentActivity[] 
}) {
  return (
    <Card className="p-5 border-muted col-span-full">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Letzte Aktivitäten</p>
            <p className="text-xs text-muted-foreground mt-0.5">Die neuesten Ereignisse in Ihrer Praxis</p>
          </div>
        </div>
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div
                className={`p-2 rounded-lg ${
                  activity.priority === "high" 
                    ? "bg-red-500/10 text-red-500" 
                    : activity.priority === "medium" 
                      ? "bg-amber-500/10 text-amber-500" 
                      : "bg-blue-500/10 text-blue-500"
                }`}
              >
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
})

"use client"

import { memo } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Clock, CheckSquare, CalendarDays, Activity, ArrowUpRight } from "lucide-react"
import Link from "next/link"
// Charts are now inline - no longer using charts.tsx SVG components

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
  const totalCompleted = data.reduce((sum, d) => sum + (d.completed || 0), 0)
  const totalPending = data.reduce((sum, d) => sum + (d.pending || 0), 0)
  const maxValue = Math.max(...data.flatMap((d) => [(d.completed || 0), (d.pending || 0)]), 1)

  return (
    <Link href="/todos" className="flex flex-col flex-1 min-h-0">
    <Card className="p-5 border-muted col-span-full hover:shadow-md transition-shadow cursor-pointer flex-1 overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{"Wöchentliche Aufgaben"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalCompleted} erledigt, {totalPending} ausstehend
              </p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {data.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            Keine Daten verfügbar
          </div>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {data.map((item, index) => {
              const completedH = Math.max(((item.completed || 0) / maxValue) * 100, 2)
              const pendingH = Math.max(((item.pending || 0) / maxValue) * 100, 2)
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex gap-1 items-end h-24">
                    <div
                      className="flex-1 bg-primary/80 rounded-t transition-all hover:bg-primary"
                      style={{ height: `${completedH}%` }}
                      title={`Erledigt: ${item.completed}`}
                    />
                    <div
                      className="flex-1 bg-muted rounded-t transition-all hover:bg-muted/80"
                      style={{ height: `${pendingH}%` }}
                      title={`Ausstehend: ${item.pending}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{item.day}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-primary/80 rounded-sm" />
            <span className="text-muted-foreground">Erledigt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-muted rounded-sm" />
            <span className="text-muted-foreground">Ausstehend</span>
          </div>
        </div>
      </div>
    </Card>
    </Link>
  )
})

export const TodayScheduleWidget = memo(function TodayScheduleWidget({ data }: { data: TodayScheduleData[] }) {
  const totalAppointments = data.reduce((sum, d) => sum + (d.appointments || 0), 0)
  const maxAppointments = Math.max(...data.map((d) => d.appointments || 0), 1)

  return (
    <Link href="/calendar" className="flex flex-col flex-1 min-h-0">
    <Card className="p-5 border-muted col-span-full hover:shadow-md transition-shadow cursor-pointer flex-1 overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Heutiger Terminplan</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalAppointments} {totalAppointments === 1 ? "Termin" : "Termine"} heute
              </p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {data.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            Keine Termine heute
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((slot, index) => {
              const barWidth = Math.max(((slot.appointments || 0) / maxAppointments) * 100, 4)
              return (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-12 shrink-0 text-right">
                    {slot.time}
                  </span>
                  <div className="flex-1 h-7 bg-muted/40 rounded-md overflow-hidden relative">
                    <div
                      className="h-full bg-blue-500/20 rounded-md transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                    {slot.appointments > 0 && (
                      <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium text-blue-700">
                        {slot.appointments}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
    </Link>
  )
})

export const ActivityChartWidget = memo(function ActivityChartWidget({ data }: { data: ActivityData[] }) {
  const totalActivity = data.reduce((sum, d) => sum + (d.value || 0), 0)
  const maxValue = Math.max(...data.map((d) => d.value || 0), 1)

  return (
    <Link href="/analytics" className="flex flex-col flex-1 min-h-0">
    <Card className="p-5 border-muted col-span-full hover:shadow-md transition-shadow cursor-pointer flex-1 overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{"Aktivität"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalActivity} {"Aktionen in den letzten 7 Tagen"}
              </p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {data.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            {"Keine Daten verfügbar"}
          </div>
        ) : (
          <div className="flex items-end gap-1.5 h-28">
            {data.map((item, index) => {
              const barHeight = Math.max(((item.value || 0) / maxValue) * 100, 4)
              const dateLabel = item.date.length > 5
                ? new Date(item.date).toLocaleDateString("de-DE", { weekday: "short" })
                : item.date
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex flex-col items-center justify-end h-20">
                    {item.value > 0 && (
                      <span className="text-[10px] font-medium text-muted-foreground mb-0.5">
                        {item.value}
                      </span>
                    )}
                    <div
                      className="w-full max-w-8 bg-teal-500/20 rounded-t transition-all hover:bg-teal-500/30"
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{dateLabel}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
    </Link>
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
    <Link href="/analytics" className="flex flex-col flex-1 min-h-0">
    <Card className="p-3.5 hover:shadow-md transition-shadow cursor-pointer flex-1 overflow-hidden">
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <TrendingUp className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground leading-tight">Praxis-Score</p>
          <p className="text-2xl font-bold tracking-tight mt-0.5">{score}</p>
          <p className="text-xs text-muted-foreground">von 100 Punkten</p>
        </div>
      </div>
      {trend !== 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs">
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
    </Link>
  )
})

export const RecentActivitiesWidget = memo(function RecentActivitiesWidget({ 
  activities 
}: { 
  activities: RecentActivity[] 
}) {
  return (
    <Card className="p-5 border-muted col-span-full flex-1 overflow-hidden">
      <div className="space-y-4">
        <Link href="/todos" className="flex items-start justify-between hover:opacity-80 transition-opacity">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Letzte Aktivitäten</p>
              <p className="text-xs text-muted-foreground mt-0.5">Die neuesten Ereignisse in Ihrer Praxis</p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground mt-1" />
        </Link>
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

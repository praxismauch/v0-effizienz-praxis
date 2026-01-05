"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from "recharts"
import { TrendingUp, TrendingDown, Clock, Users, Star, CheckSquare } from "lucide-react"
import { useAnalyticsData } from "@/contexts/analytics-data-context"
import { useTranslation } from "@/contexts/translation-context"
import { GoogleReviewsWidget } from "@/components/google-reviews-widget"
import { useUser } from "@/contexts/user-context"

const iconMap = {
  Star,
  CheckSquare,
  Clock,
  Users,
}

export function PerformanceMetrics() {
  const { kpiData, efficiencyData, qualityMetricsData } = useAnalyticsData()
  const { t } = useTranslation()
  const { currentPractice } = useUser()

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => {
          const IconComponent = iconMap[kpi.icon as keyof typeof iconMap] || Star
          return (
            <Card key={kpi.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={kpi.trend === "up" ? "default" : "secondary"} className="text-xs">
                    {kpi.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {kpi.change}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t("analytics.kpi.target", "Target")}: {kpi.target}
                  </span>
                </div>
                <Progress value={kpi.progress} className="mt-3" />
              </CardContent>
            </Card>
          )
        })}

        {currentPractice && (
          <GoogleReviewsWidget
            practiceId={currentPractice.id}
            practiceName={currentPractice.name}
            practiceWebsiteUrl={currentPractice.website}
          />
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Efficiency Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("analytics.efficiency.title", "Practice Efficiency")}</CardTitle>
            <CardDescription>
              {t("analytics.efficiency.description", "Weekly efficiency and throughput metrics")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tasksPerDay"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ fill: "#a855f7" }}
                />
                <Line
                  type="monotone"
                  dataKey="teamThroughput"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  dot={{ fill: "#14b8a6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quality Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("analytics.quality.title", "Quality Metrics")}</CardTitle>
            <CardDescription>
              {t("analytics.quality.description", "Team satisfaction and work quality indicators")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={qualityMetricsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="satisfaction"
                  stackId="1"
                  stroke="#ec4899"
                  fill="#ec4899"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="completionRate"
                  stackId="2"
                  stroke="#84cc16"
                  fill="#84cc16"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PerformanceMetrics

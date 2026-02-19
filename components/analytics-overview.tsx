"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useAnalyticsData } from "@/contexts/analytics-data-context"

export function AnalyticsOverview() {
  const { practiceGrowthData, taskCategoryData, teamSatisfactionData } = useAnalyticsData()

  console.log("[v0] AnalyticsOverview data:", {
    growthCount: practiceGrowthData?.length,
    categoryCount: taskCategoryData?.length,
    satisfactionCount: teamSatisfactionData?.length,
  })

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Practice Growth */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Praxiswachstum</CardTitle>
          <CardDescription>Aufgaben und Umsatz im Zeitverlauf</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={practiceGrowthData || []}>
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
              <Area type="monotone" dataKey="tasks" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
              <Area type="monotone" dataKey="revenue" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Task Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aufgabenverteilung</CardTitle>
          <CardDescription>Verteilung nach Aufgabenstatus</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={taskCategoryData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {(taskCategoryData || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {(taskCategoryData || []).map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">
                  {item.name} ({item.value}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Satisfaction */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Teamzufriedenheit</CardTitle>
          <CardDescription>Wöchentliche Zufriedenheitswerte und Rücklaufquoten</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={teamSatisfactionData || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" className="text-xs" />
              <YAxis domain={[4.0, 5.0]} className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Line type="monotone" dataKey="satisfaction" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b" }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalyticsOverview

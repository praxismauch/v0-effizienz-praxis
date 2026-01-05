"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePractice } from "@/contexts/practice-context"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Loader2 } from "lucide-react"

interface SickDaysChartProps {
  showOnDashboard?: boolean
}

export function SickDaysChart({ showOnDashboard = false }: SickDaysChartProps) {
  const { currentPractice } = usePractice()
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [userData, setUserData] = useState<any[]>([])
  const [totalDays, setTotalDays] = useState(0)
  const [viewMode, setViewMode] = useState<"monthly" | "users">("monthly")

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())

  useEffect(() => {
    fetchStats()
  }, [currentPractice?.id, year])

  const fetchStats = async () => {
    if (!currentPractice?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/sick-leaves/stats?year=${year}`)
      const data = await response.json()

      if (response.ok) {
        setMonthlyData(data.monthlyStats || [])
        setUserData(data.userStats || [])
        setTotalDays(data.totalDays || 0)
      }
    } catch (error) {
      console.error("[v0] Error fetching sick leave stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const chartConfig = {
    days: {
      label: "Kranktage",
      color: "hsl(var(--chart-1))",
    },
  }

  // Colors for user bars
  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ]

  if (showOnDashboard) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Kranktage {year}</CardTitle>
            <span className="text-2xl font-bold">{totalDays}</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[120px]">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="days" fill="var(--color-days)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Kranktage Übersicht</CardTitle>
            <CardDescription>Verteilung der Kranktage im Jahr {year}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Nach Monat</SelectItem>
                <SelectItem value="users">Nach Mitarbeiter</SelectItem>
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Gesamte Kranktage in {year}</div>
              <div className="text-3xl font-bold">{totalDays} Tage</div>
            </div>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {viewMode === "monthly" ? (
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="days" fill="var(--color-days)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={userData} layout="vertical">
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={100} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="days" radius={[0, 4, 4, 0]}>
                      {userData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default SickDaysChart

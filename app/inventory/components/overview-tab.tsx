"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import type { InventoryItem } from "../types"
import { CATEGORIES } from "../types"

interface OverviewTabProps {
  items: InventoryItem[]
}

export function OverviewTab({ items }: OverviewTabProps) {
  const [consumptionData, setConsumptionData] = useState<Array<{ name: string; value: number }>>([])

  useEffect(() => {
    const fetchConsumptionData = async () => {
      try {
        // Fetch real consumption data from database
        const response = await fetch("/api/inventory/consumption-history?days=7")
        if (response.ok) {
          const data = await response.json()
          setConsumptionData(data)
        } else {
          // Fallback: generate empty data structure if no history
          const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
          setConsumptionData(days.map((day) => ({ name: day, value: 0 })))
        }
      } catch (error) {
        console.error("[v0] Error fetching consumption data:", error)
        // Fallback empty data
        const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
        setConsumptionData(days.map((day) => ({ name: day, value: 0 })))
      }
    }
    
    fetchConsumptionData()
  }, [items])

  // Category distribution
  const categoryData = CATEGORIES.map((cat) => ({
    name: cat.label,
    value: items.filter((i) => i.category === cat.value).length,
    color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280"][CATEGORIES.indexOf(cat)],
  })).filter((d) => d.value > 0)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Consumption Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Verbrauchstrend
          </CardTitle>
          <CardDescription>Materialverbrauch der letzten 7 Tage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={consumptionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-500" />
            Kategorieverteilung
          </CardTitle>
          <CardDescription>Artikel nach Kategorie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">Keine Daten vorhanden</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

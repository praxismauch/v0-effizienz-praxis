"use client"

import { memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface TopFeaturesListProps {
  features: Array<{ feature_name: string; usage_count: number }>
}

export const TopFeaturesList = memo(function TopFeaturesList({ features }: TopFeaturesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Features</CardTitle>
        <CardDescription>Meist genutzte Funktionen</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {features.slice(0, 10).map((feature, index) => (
            <div key={feature.feature_name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 flex items-center justify-center text-xs">
                  {index + 1}
                </Badge>
                <span className="text-sm font-medium">{feature.feature_name}</span>
              </div>
              <span className="text-sm text-muted-foreground">{feature.usage_count} Mal</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})

interface FeatureUsageBarChartProps {
  features: Array<{ feature_name: string; usage_count: number }>
}

export const FeatureUsageBarChart = memo(function FeatureUsageBarChart({ features }: FeatureUsageBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature-Nutzung nach Kategorie</CardTitle>
        <CardDescription>Verteilung der Funktionsnutzung</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={features.slice(0, 15)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="feature_name" angle={-45} textAnchor="end" height={120} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="usage_count" fill="#3b82f6" name="Nutzungen" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

interface FeatureAdoptionListProps {
  features: Array<{ feature_name: string; unique_practices?: number }>
  totalPractices: number
}

export const FeatureAdoptionList = memo(function FeatureAdoptionList({ features, totalPractices }: FeatureAdoptionListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature-Adoption</CardTitle>
        <CardDescription>Wie viele Praxen nutzen welche Features</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {features.slice(0, 10).map((feature) => {
            const adoptionRate = totalPractices
              ? (((feature.unique_practices || 0) / totalPractices) * 100).toFixed(1)
              : 0
            return (
              <div key={feature.feature_name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{feature.feature_name}</span>
                  <span className="text-muted-foreground">{adoptionRate}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${adoptionRate}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
})

"use client"

import { AlertCircle, CheckCircle2, Clock, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Stats, categoryIcons, sourceIcons } from "../logging-types"

interface LoggingStatsProps {
  stats: Stats
  onFilterChange: (key: string, value: string) => void
}

export function LoggingStats({ stats, onFilterChange }: LoggingStatsProps) {
  return (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.last24h} in den letzten 24h
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fehler</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {((stats.byLevel.error || 0) + (stats.byLevel.critical || 0)).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.byLevel.critical || 0} kritisch
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ungelost</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {((stats.byStatus.new || 0) + (stats.byStatus.acknowledged || 0) + (stats.byStatus.investigating || 0)).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.byStatus.new || 0} neue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gelöst</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {(stats.byStatus.resolved || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.byStatus.ignored || 0} ignoriert
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category & Source Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Nach Kategorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byCategory).map(([category, count]) => {
                const Icon = categoryIcons[category] || Activity
                return (
                  <Badge
                    key={category}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => onFilterChange("category", category)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {category}: {count}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Nach Quelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.bySource).map(([source, count]) => {
                const Icon = sourceIcons[source] || Activity
                return (
                  <Badge
                    key={source}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => onFilterChange("source", source)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {source}: {count}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

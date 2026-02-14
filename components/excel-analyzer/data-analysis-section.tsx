"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  LineChartIcon,
  PieChartIcon,
  TrendingUp,
  Download,
  RefreshCw,
  Calendar,
  Filter,
} from "lucide-react"
import type { ExcelData, ChartConfig } from "./types"
import { ChartRenderer } from "./chart-renderer"

interface DataAnalysisSectionProps {
  selectedFile: ExcelData
  chartConfig: ChartConfig
  onChartConfigChange: (config: ChartConfig) => void
  filteredData: Record<string, any>[]
}

export function DataAnalysisSection({
  selectedFile,
  chartConfig,
  onChartConfigChange,
  filteredData,
}: DataAnalysisSectionProps) {
  const chartTypeLabel =
    chartConfig.type === "line"
      ? "Liniendiagramm"
      : chartConfig.type === "area"
        ? "Flächendiagramm"
        : chartConfig.type === "bar"
          ? "Balkendiagramm"
          : "Kreisdiagramm"

  const timeRangeLabel =
    chartConfig.timeRange === "all"
      ? "Alle"
      : chartConfig.timeRange === "30d"
        ? "30T"
        : chartConfig.timeRange === "90d"
          ? "90T"
          : "1J"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datenanalyse - {selectedFile.fileName}</CardTitle>
        <CardDescription>Konfigurieren Sie Parameter und Zeiträume für die Visualisierung</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="configure" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configure" className="gap-2">
              <Filter className="h-4 w-4" />
              Konfiguration
            </TabsTrigger>
            <TabsTrigger value="visualize" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Visualisierung
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Diagrammtyp</label>
                <Select
                  value={chartConfig.type}
                  onValueChange={(value: any) => onChartConfigChange({ ...chartConfig, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">
                      <div className="flex items-center gap-2">
                        <LineChartIcon className="h-4 w-4" />
                        Liniendiagramm
                      </div>
                    </SelectItem>
                    <SelectItem value="area">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Flächendiagramm
                      </div>
                    </SelectItem>
                    <SelectItem value="bar">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Balkendiagramm
                      </div>
                    </SelectItem>
                    <SelectItem value="pie">
                      <div className="flex items-center gap-2">
                        <PieChartIcon className="h-4 w-4" />
                        Kreisdiagramm
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{"X-Achse (Zeit)"}</label>
                <Select
                  value={chartConfig.xAxis}
                  onValueChange={(value) => onChartConfigChange({ ...chartConfig, xAxis: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedFile.columns.map((column) => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Zeitraum</label>
                <Select
                  value={chartConfig.timeRange}
                  onValueChange={(value) => onChartConfigChange({ ...chartConfig, timeRange: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Daten</SelectItem>
                    <SelectItem value="30d">Letzte 30 Tage</SelectItem>
                    <SelectItem value="90d">Letzte 90 Tage</SelectItem>
                    <SelectItem value="1y">Letztes Jahr</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button className="gap-2 w-full">
                  <RefreshCw className="h-4 w-4" />
                  Aktualisieren
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{"Y-Achse Parameter (Werte)"}</label>
              <div className="grid gap-2 md:grid-cols-3">
                {selectedFile.columns
                  .filter((col) => col !== chartConfig.xAxis)
                  .map((column) => (
                    <div key={column} className="flex items-center space-x-2">
                      <Checkbox
                        id={column}
                        checked={chartConfig.yAxis.includes(column)}
                        onCheckedChange={(checked) => {
                          const newYAxis = checked
                            ? [...chartConfig.yAxis, column]
                            : chartConfig.yAxis.filter((y) => y !== column)
                          onChartConfigChange({ ...chartConfig, yAxis: newYAxis })
                        }}
                      />
                      <label htmlFor={column} className="text-sm">
                        {column}
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="visualize" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">{chartTypeLabel}</h3>
                <p className="text-sm text-muted-foreground">
                  {chartConfig.yAxis.join(", ")} über {chartConfig.xAxis}
                </p>
              </div>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Exportieren
              </Button>
            </div>

            <div className="border border-border rounded-lg p-4">
              <ChartRenderer data={filteredData} config={chartConfig} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Datenpunkte</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{filteredData.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Parameter</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{chartConfig.yAxis.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Zeitraum</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{timeRangeLabel}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

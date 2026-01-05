"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Download, Send, CheckSquare, TrendingUp, Users, DollarSign } from "lucide-react"
import { useTranslation } from "@/contexts/translation-context"

export function ReportsGenerator() {
  const { t } = useTranslation()
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])

  const reportTemplates = [
    {
      id: "financial",
      name: t("reports.templates.financial.name", "Financial Overview"),
      description: t("reports.templates.financial.description", "Revenue, expenses, and billing analytics"),
      icon: DollarSign,
      frequency: t("reports.frequency.monthly", "Monthly"),
      lastGenerated: "2024-01-15",
    },
    {
      id: "team",
      name: t("reports.templates.team.name", "Team Analytics"),
      description: t("reports.templates.team.description", "Team demographics and work patterns"),
      icon: Users,
      frequency: t("reports.frequency.quarterly", "Quarterly"),
      lastGenerated: "2024-01-01",
    },
    {
      id: "performance",
      name: t("reports.templates.performance.name", "Practice Performance"),
      description: t("reports.templates.performance.description", "KPIs, efficiency metrics, and quality indicators"),
      icon: TrendingUp,
      frequency: t("reports.frequency.monthly", "Monthly"),
      lastGenerated: "2024-01-15",
    },
    {
      id: "tasks",
      name: t("reports.templates.tasks.name", "Task Report"),
      description: t("reports.templates.tasks.description", "Task patterns and utilization rates"),
      icon: CheckSquare,
      frequency: t("reports.frequency.weekly", "Weekly"),
      lastGenerated: "2024-01-20",
    },
  ]

  const recentReports = [
    {
      id: 1,
      name: t("reports.recent.januaryFinancial", "January Financial Overview"),
      type: t("reports.templates.financial.name", "Financial"),
      generatedDate: "2024-01-31",
      status: "completed",
      size: "2.4 MB",
    },
    {
      id: 2,
      name: t("reports.recent.q4Team", "Q4 2023 Team Analytics"),
      type: t("reports.templates.team.name", "Team Analytics"),
      generatedDate: "2024-01-15",
      status: "completed",
      size: "1.8 MB",
    },
    {
      id: 3,
      name: t("reports.recent.weeklyTask", "Weekly Task Report"),
      type: t("reports.templates.tasks.name", "Tasks"),
      generatedDate: "2024-01-28",
      status: "completed",
      size: "856 KB",
    },
    {
      id: 4,
      name: t("reports.recent.januaryPerformance", "January Performance Report"),
      type: t("reports.templates.performance.name", "Performance"),
      generatedDate: "2024-01-30",
      status: "processing",
      size: t("reports.status.processing", "Processing..."),
    },
  ]

  const metrics = [
    t("reports.metrics.teamCount", "Team Count"),
    t("reports.metrics.revenueAnalysis", "Revenue Analysis"),
    t("reports.metrics.taskStatistics", "Task Statistics"),
    t("reports.metrics.processingTimes", "Processing Times"),
    t("reports.metrics.teamSatisfaction", "Team Satisfaction"),
    t("reports.metrics.collectionRates", "Collection Rates"),
    t("reports.metrics.insuranceClaims", "Insurance Claims"),
    t("reports.metrics.providerPerformance", "Provider Performance"),
  ]

  return (
    <div className="space-y-6">
      {/* Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("reports.generator.title", "Create New Report")}</CardTitle>
          <CardDescription>
            {t("reports.generator.description", "Generate custom reports with specific metrics and date ranges")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("reports.generator.template", "Report Template")}</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder={t("reports.generator.templatePlaceholder", "Choose a report template")} />
                </SelectTrigger>
                <SelectContent>
                  {reportTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("reports.generator.dateRange", "Date Range")}</label>
              <DatePickerWithRange />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("reports.generator.includeMetrics", "Include Metrics")}</label>
            <div className="grid gap-2 md:grid-cols-2">
              {metrics.map((metric) => (
                <div key={metric} className="flex items-center space-x-2">
                  <Checkbox
                    id={metric}
                    checked={selectedMetrics.includes(metric)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedMetrics([...selectedMetrics, metric])
                      } else {
                        setSelectedMetrics(selectedMetrics.filter((m) => m !== metric))
                      }
                    }}
                  />
                  <label htmlFor={metric} className="text-sm">
                    {metric}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              {t("reports.generator.generate", "Generate Report")}
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Send className="h-4 w-4" />
              {t("reports.generator.schedule", "Schedule Report")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("reports.templatesSection.title", "Report Templates")}</CardTitle>
          <CardDescription>
            {t("reports.templatesSection.description", "Pre-configured report templates for common analyses")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <template.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{template.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {template.frequency}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("reports.lastGenerated", "Last generated")}: {template.lastGenerated}
                      </p>
                      <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                        <FileText className="h-3 w-3" />
                        {t("reports.generate", "Generate")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("reports.recentSection.title", "Recent Reports")}</CardTitle>
          <CardDescription>
            {t("reports.recentSection.description", "Previously generated reports and their status")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{report.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{report.type}</span>
                      <span>•</span>
                      <span>{report.generatedDate}</span>
                      <span>•</span>
                      <span>{report.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={report.status === "completed" ? "default" : "secondary"} className="text-xs">
                    {report.status === "completed"
                      ? t("reports.status.completed", "completed")
                      : t("reports.status.processing", "processing")}
                  </Badge>
                  {report.status === "completed" && (
                    <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                      <Download className="h-3 w-3" />
                      {t("reports.download", "Download")}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReportsGenerator

"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Download,
  Calendar,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingUp,
  Users,
  Target,
  FileText,
  Briefcase,
  Lightbulb,
} from "lucide-react"

interface AIAnalysis {
  id: string
  analysis_type: string
  title: string
  summary: string
  full_analysis: any
  metadata: any
  created_at: string
}

const analysisTypeLabels: Record<string, string> = {
  recruiting: "Recruiting",
  team: "Team",
  candidates: "Kandidaten",
  documents: "Dokumente",
  knowledge: "Wissensdatenbank",
  practice: "Praxis-Gesamtanalyse",
}

const analysisTypeColors: Record<string, string> = {
  recruiting: "bg-blue-100 text-blue-800",
  team: "bg-purple-100 text-purple-800",
  candidates: "bg-green-100 text-green-800",
  documents: "bg-orange-100 text-orange-800",
  knowledge: "bg-cyan-100 text-cyan-800",
  practice: "bg-pink-100 text-pink-800",
}

interface AIAnalysisDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysis: AIAnalysis | null
}

const formatDate = (date: Date | string, includeTime = false) => {
  const d = typeof date === "string" ? new Date(date) : date
  if (includeTime) {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
  }
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d)
}

const formatDateShort = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .split(".")
    .reverse()
    .join("-")
}

const getInsightIcon = (type: string, category?: string) => {
  if (category === "Team") return <Users className="h-5 w-5" />
  if (category === "Ziele") return <Target className="h-5 w-5" />
  if (category === "Workflows") return <Briefcase className="h-5 w-5" />
  if (category === "Dokumente") return <FileText className="h-5 w-5" />

  switch (type) {
    case "success":
      return <CheckCircle2 className="h-5 w-5" />
    case "warning":
      return <AlertTriangle className="h-5 w-5" />
    case "improvement":
      return <TrendingUp className="h-5 w-5" />
    case "suggestion":
      return <Lightbulb className="h-5 w-5" />
    default:
      return <Info className="h-5 w-5" />
  }
}

const getInsightColors = (type: string) => {
  switch (type) {
    case "success":
      return {
        bg: "bg-green-50 border-green-200",
        icon: "text-green-600",
        badge: "bg-green-100 text-green-800",
      }
    case "warning":
      return {
        bg: "bg-amber-50 border-amber-200",
        icon: "text-amber-600",
        badge: "bg-amber-100 text-amber-800",
      }
    case "improvement":
      return {
        bg: "bg-blue-50 border-blue-200",
        icon: "text-blue-600",
        badge: "bg-blue-100 text-blue-800",
      }
    case "suggestion":
      return {
        bg: "bg-purple-50 border-purple-200",
        icon: "text-purple-600",
        badge: "bg-purple-100 text-purple-800",
      }
    default:
      return {
        bg: "bg-gray-50 border-gray-200",
        icon: "text-gray-600",
        badge: "bg-gray-100 text-gray-800",
      }
  }
}

interface Insight {
  type: string
  title: string
  metric?: string
  category?: string
  description: string
}

export function AIAnalysisDetailDialog({ open, onOpenChange, analysis }: AIAnalysisDetailDialogProps) {
  if (!analysis) return null

  const handleDownload = () => {
    const content = `# ${analysis.title}

**Typ:** ${analysisTypeLabels[analysis.analysis_type] || analysis.analysis_type}
**Erstellt am:** ${formatDate(analysis.created_at, true)}

## Zusammenfassung

${analysis.summary || "Keine Zusammenfassung verfügbar"}

## Vollständige Analyse

${JSON.stringify(analysis.full_analysis, null, 2)}
`

    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ki-analyse-${analysis.id}-${formatDateShort(analysis.created_at)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderAnalysisContent = () => {
    const data = analysis.full_analysis

    if (!data) {
      return <p className="text-sm text-muted-foreground">Keine Analysedaten verfügbar</p>
    }

    // Handle string data
    if (typeof data === "string") {
      return (
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-sm">{data}</p>
        </div>
      )
    }

    // Handle array of insights (the format shown in the screenshot)
    if (Array.isArray(data)) {
      const insights = data as Insight[]

      // Group insights by category
      const groupedInsights = insights.reduce(
        (acc, insight) => {
          const category = insight.category || "Allgemein"
          if (!acc[category]) {
            acc[category] = []
          }
          acc[category].push(insight)
          return acc
        },
        {} as Record<string, Insight[]>,
      )

      return (
        <div className="space-y-6">
          {Object.entries(groupedInsights).map(([category, categoryInsights]) => (
            <div key={category} className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{category}</h4>
              <div className="grid gap-3">
                {categoryInsights.map((insight, index) => {
                  const colors = getInsightColors(insight.type)
                  return (
                    <div key={index} className={`p-4 rounded-lg border ${colors.bg} transition-all hover:shadow-sm`}>
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${colors.icon}`}>{getInsightIcon(insight.type, insight.category)}</div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="font-medium text-foreground">{insight.title}</h5>
                            {insight.metric && (
                              <Badge variant="secondary" className={colors.badge}>
                                {insight.metric}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Handle object with insights array inside
    if (typeof data === "object" && data.insights && Array.isArray(data.insights)) {
      const insights = data.insights as Insight[]
      return renderInsightsCards(insights)
    }

    // Handle generic object (old behavior but improved)
    if (typeof data === "object") {
      return (
        <div className="space-y-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <h4 className="font-semibold text-sm capitalize">{key.replace(/_/g, " ").replace(/([A-Z])/g, " $1")}</h4>
              <div className="text-sm text-muted-foreground">
                {typeof value === "string" ? (
                  <p>{value}</p>
                ) : typeof value === "number" ? (
                  <p className="font-medium">{value}</p>
                ) : Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && "title" in value[0] ? (
                  renderInsightsCards(value as Insight[])
                ) : (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    }

    return <p className="text-sm text-muted-foreground">Keine Analysedaten verfügbar</p>
  }

  // Helper function to render insights as cards
  const renderInsightsCards = (insights: Insight[]) => {
    const groupedInsights = insights.reduce(
      (acc, insight) => {
        const category = insight.category || "Allgemein"
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(insight)
        return acc
      },
      {} as Record<string, Insight[]>,
    )

    return (
      <div className="space-y-6">
        {Object.entries(groupedInsights).map(([category, categoryInsights]) => (
          <div key={category} className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{category}</h4>
            <div className="grid gap-3">
              {categoryInsights.map((insight, index) => {
                const colors = getInsightColors(insight.type)
                return (
                  <div key={index} className={`p-4 rounded-lg border ${colors.bg} transition-all hover:shadow-sm`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${colors.icon}`}>{getInsightIcon(insight.type, insight.category)}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-medium text-foreground">{insight.title}</h5>
                          {insight.metric && (
                            <Badge variant="secondary" className={colors.badge}>
                              {insight.metric}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-2xl">{analysis.title}</DialogTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <Badge className={analysisTypeColors[analysis.analysis_type] || "bg-gray-100 text-gray-800"}>
                    {analysisTypeLabels[analysis.analysis_type] || analysis.analysis_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(analysis.created_at, true)}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Exportieren
            </Button>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="space-y-6 pr-4">
            {analysis.summary && (
              <div className="space-y-2">
                <h3 className="font-semibold">Zusammenfassung</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <h3 className="font-semibold">Vollständige Analyse</h3>
              {renderAnalysisContent()}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

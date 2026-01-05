"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, FileText, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { usePractice } from "@/contexts/practice-context"

interface AnalysisResult {
  completeness: number
  summary: string
  gaps: string[]
  recommendations: string[]
  categoryAnalysis: Record<string, { coverage: string; comment: string }>
  categoryDistribution: Record<string, number>
  totalArticles: number
}

export function AIKnowledgeAnalyzerDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const { currentPractice } = usePractice()

  const analyzeKnowledgeBase = async () => {
    if (!currentPractice) return

    setLoading(true)
    try {
      const response = await fetch(`/api/knowledge-base/ai-analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceId: currentPractice.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze knowledge base")
      }

      const data = await response.json()

      setAnalysis({
        completeness: data.completeness || 0,
        summary: data.summary || "",
        gaps: data.gaps || [],
        recommendations: data.recommendations || [],
        categoryAnalysis: data.categoryAnalysis || {},
        categoryDistribution: data.categoryDistribution || {},
        totalArticles: data.totalArticles || 0,
      })
    } catch (error) {
      console.error("[v0] Error analyzing knowledge base:", error)
      setAnalysis({
        completeness: 0,
        summary: "Fehler bei der Analyse. Bitte versuchen Sie es erneut.",
        gaps: [],
        recommendations: [],
        categoryAnalysis: {},
        categoryDistribution: {},
        totalArticles: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && !analysis) {
      analyzeKnowledgeBase()
    }
  }

  const getCoverageColor = (coverage: string) => {
    switch (coverage?.toLowerCase()) {
      case "gut":
        return "text-green-600"
      case "mittel":
        return "text-yellow-600"
      case "schlecht":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 text-white shadow-md hover:shadow-lg transition-all border-0">
          <Sparkles className="h-4 w-4 mr-2" />
          KI-Analyse
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-primary" />
            KI-Analyse der QM-Dokumentation
          </DialogTitle>
          <DialogDescription>
            Intelligente Bewertung der Vollständigkeit und Qualität Ihrer Qualitätsmanagement-Dokumentation
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="text-sm text-muted-foreground">Analysiere QM-Dokumentation...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Completeness Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Vollständigkeit
                  </span>
                  <span className="text-3xl font-bold text-primary">{analysis.completeness}%</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={analysis.completeness} className="h-3" />
                <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                <div className="text-xs text-muted-foreground">
                  {analysis.totalArticles} veröffentlichte Artikel in{" "}
                  {Object.keys(analysis.categoryDistribution || {}).length} Kategorien
                </div>
              </CardContent>
            </Card>

            {/* Category Analysis */}
            {analysis.categoryAnalysis &&
              typeof analysis.categoryAnalysis === "object" &&
              Object.keys(analysis.categoryAnalysis).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Kategorien-Abdeckung
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(analysis.categoryAnalysis).map(([category, data]) => (
                      <div key={category} className="border-l-4 border-primary/30 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{category}</span>
                          <span className={`text-sm font-semibold ${getCoverageColor(data?.coverage)}`}>
                            {data?.coverage || "N/A"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{data?.comment || ""}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

            {/* Gaps */}
            {analysis.gaps && analysis.gaps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-5 w-5" />
                    Identifizierte Lücken
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.gaps.map((gap, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 bg-orange-50 dark:bg-orange-950/20 rounded">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{gap}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    Empfehlungen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 bg-green-50 dark:bg-green-950/20 rounded">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            Analyse wird beim Öffnen automatisch gestartet
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

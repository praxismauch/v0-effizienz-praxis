"use client"

import { useRef, useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast" // Import useToast hook

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Lightbulb } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface AnalysisInsight {
  type: "success" | "warning" | "improvement"
  category: string
  title: string
  description: string
  metric?: string
}

interface PracticeAnalysis {
  overallScore: number
  insights: AnalysisInsight[]
  summary: string
  recommendations: string[]
  generatedAt: string
}

export function AIPracticeAnalysis({ onScoreUpdate }: { onScoreUpdate?: (score: number) => void } = {}) {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { toast } = useToast() // Use the imported useToast hook
  const [analysis, setAnalysis] = useState<PracticeAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  const lastAnalyzedPracticeIdRef = useRef<string | null>(null)

  useEffect(() => {
    setHasMounted(true)
    const saved = localStorage.getItem("aiAnalysisAutoUpdate")
    if (saved !== null) {
      setAutoUpdate(saved === "true")
    }
  }, [])

  const handleAutoUpdateChange = (checked: boolean) => {
    setAutoUpdate(checked)
    if (typeof window !== "undefined") {
      localStorage.setItem("aiAnalysisAutoUpdate", String(checked))
    }
  }

  const fetchAnalysis = async () => {
    const practiceId = currentPractice?.id
    const userId = currentUser?.id

    if (!practiceId || practiceId === "" || practiceId === null || practiceId === undefined) {
      toast({
        title: "Keine Praxis ausgewählt",
        description: "Bitte wählen Sie eine Praxis aus, um die Analyse durchzuführen.",
        variant: "destructive",
      })
      return
    }

    if (!userId) {
      toast({
        title: "Nicht authentifiziert",
        description: "Bitte melden Sie sich an, um die Analyse durchzuführen.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setProgress(0)
    setProgressMessage("Analysedaten werden geladen...")

    try {
      const startTime = Date.now()
      const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        setProgress((prev) => {
          // Phase 1: 0-30% in first 5s (data loading)
          if (elapsed < 5) {
            setProgressMessage("Praxisdaten werden abgerufen...")
            return Math.min(30, Math.round(elapsed * 6))
          }
          // Phase 2: 30-55% in 5-15s (team analysis)
          if (elapsed < 15) {
            setProgressMessage("Team-Performance wird analysiert...")
            return Math.min(55, 30 + Math.round((elapsed - 5) * 2.5))
          }
          // Phase 3: 55-75% in 15-30s (KPI calculation)
          if (elapsed < 30) {
            setProgressMessage("KPIs werden berechnet...")
            return Math.min(75, 55 + Math.round((elapsed - 15) * 1.33))
          }
          // Phase 4: 75-88% in 30-60s (AI recommendations)
          if (elapsed < 60) {
            setProgressMessage("KI-Empfehlungen werden generiert...")
            return Math.min(88, 75 + Math.round((elapsed - 30) * 0.43))
          }
          // Phase 5: 88-95% after 60s (preparing results)
          if (prev < 95) {
            setProgressMessage("Ergebnisse werden aufbereitet...")
            return Math.min(95, prev + 0.2)
          }
          return prev
        })
      }, 500)

      const response = await fetch("/api/ai-analysis/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceId, userId }),
      })

      clearInterval(progressInterval)
      setProgress(100)
      setProgressMessage("Analyse abgeschlossen!")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] AI Analysis - Error response:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: Fehler beim Laden der Analyse`)
      }

      const data = await response.json()
      setAnalysis(data)
      if (data.overallScore != null && onScoreUpdate) {
        onScoreUpdate(data.overallScore)
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der KI-Analyse:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Die KI-Analyse konnte nicht geladen werden.",
        variant: "destructive",
      })
      setProgress(0)
      setProgressMessage("")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasMounted) return

    const practiceId = currentPractice?.id

    if (autoUpdate && practiceId && practiceId !== "" && practiceId !== "0") {
      if (lastAnalyzedPracticeIdRef.current !== practiceId) {
        lastAnalyzedPracticeIdRef.current = practiceId
        fetchAnalysis()
      }
    }
  }, [currentPractice?.id, autoUpdate, hasMounted])

  if (loading && !analysis) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>KI-Analyse</CardTitle>
            </div>
          </div>
          <CardDescription>Ihre Praxisleistung wird analysiert...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">{progressMessage}</span>
              <span className="font-semibold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />

            <div className="space-y-3 pt-4">
              <div className="rounded-lg border border-muted bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Brain className="h-5 w-5 text-primary animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">KI-gestützte Analyse läuft</p>
                    <p className="text-xs text-muted-foreground">
                      Die künstliche Intelligenz analysiert Ihre Praxisdaten, Team-Performance und KPIs, um
                      personalisierte Empfehlungen zu erstellen.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-card p-3 text-center">
                  <CheckCircle
                    className={`mx-auto mb-1 h-5 w-5 ${progress > 30 ? "text-green-500" : "text-muted-foreground/30"}`}
                  />
                  <p className="text-xs font-medium">Datenerfassung</p>
                </div>
                <div className="rounded-lg border bg-card p-3 text-center">
                  <TrendingUp
                    className={`mx-auto mb-1 h-5 w-5 ${progress > 60 ? "text-blue-500" : "text-muted-foreground/30"}`}
                  />
                  <p className="text-xs font-medium">Analyse</p>
                </div>
                <div className="rounded-lg border bg-card p-3 text-center">
                  <Lightbulb
                    className={`mx-auto mb-1 h-5 w-5 ${progress > 90 ? "text-yellow-500" : "text-muted-foreground/30"}`}
                  />
                  <p className="text-xs font-medium">Empfehlungen</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    const practiceId = currentPractice?.id

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>KI-Analyse</CardTitle>
          </div>
          <CardDescription>Detaillierte KI-gestützte Analyse Ihrer Praxisleistung</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2 rounded-lg border bg-muted/20 p-3">
            <Checkbox id="auto-update" checked={autoUpdate} onCheckedChange={handleAutoUpdateChange} />
            <Label
              htmlFor="auto-update"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Automatisch beim Öffnen der Seite aktualisieren
            </Label>
          </div>

          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Wählen Sie eine Praxis aus der Dropdown-Liste oben aus, um die KI-Analyse zu starten.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getInsightIcon = (type: AnalysisInsight["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "improvement":
        return <TrendingUp className="h-5 w-5 text-blue-600" />
    }
  }

  const getInsightBadgeVariant = (type: AnalysisInsight["type"]) => {
    switch (type) {
      case "success":
        return "default"
      case "warning":
        return "secondary"
      case "improvement":
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>KI-Analyse</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={fetchAnalysis} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>
        <CardDescription>
          KI-gestützte Analyse Ihrer Praxisleistung • Zuletzt aktualisiert:{" "}
          {new Date(analysis.generatedAt).toLocaleString("de-DE")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2 rounded-lg border bg-muted/20 p-3">
          <Checkbox id="auto-update-results" checked={autoUpdate} onCheckedChange={handleAutoUpdateChange} />
          <Label
            htmlFor="auto-update-results"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Automatisch beim Öffnen der Seite aktualisieren
          </Label>
        </div>

        <div className="rounded-lg border bg-muted/50 p-6">
          <div className="text-center">
            <div className="mb-2 text-sm font-medium text-muted-foreground">Gesamtbewertung</div>
            <div className={`text-5xl font-bold ${getScoreColor(analysis.overallScore)}`}>
              {analysis.overallScore}
              <span className="text-2xl">/100</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{analysis.summary}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Erkenntnisse</h3>
          {analysis.insights.map((insight, index) => (
            <div key={index} className="flex gap-3 rounded-lg border p-4">
              <div className="flex-shrink-0 pt-0.5">{getInsightIcon(insight.type)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={getInsightBadgeVariant(insight.type)} className="text-xs">
                    {insight.category}
                  </Badge>
                  {insight.metric && (
                    <span className="text-xs font-medium text-muted-foreground">{insight.metric}</span>
                  )}
                </div>
                <p className="font-medium">{insight.title}</p>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>

        {analysis.recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Empfehlungen</h3>
            </div>
            <ul className="space-y-2">
              {analysis.recommendations.map((recommendation, index) => (
                <li key={index} className="flex gap-2 text-sm">
                  <span className="text-primary">•</span>
                  <span className="text-muted-foreground">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AIPracticeAnalysis

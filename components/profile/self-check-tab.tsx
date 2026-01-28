"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  Brain,
  Heart,
  Zap,
  Users,
  Scale,
  Target,
  Smile,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  BarChart3,
  Activity,
  Lightbulb,
  Clock,
  ArrowRight,
  RefreshCw,
  Plus,
  Eye,
  X,
} from "lucide-react"
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Area,
  AreaChart,
} from "recharts"
import { format, startOfWeek, endOfWeek, isWithinInterval, subWeeks, addWeeks } from "date-fns"
import { de } from "date-fns/locale"

interface SelfCheckData {
  id: string
  user_id: string
  practice_id: string
  assessment_date: string
  energy_level: number | null
  stress_level: number | null
  work_satisfaction: number | null
  team_harmony: number | null
  work_life_balance: number | null
  motivation: number | null
  overall_wellbeing: number | null
  overall_score: number | null
  ai_recommendations: AIRecommendations | null
  notes: string | null
  created_at: string
}

interface AIRecommendation {
  dimension: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  actionable_steps: string[]
}

interface AIRecommendations {
  recommendations: AIRecommendation[]
  overall_assessment: string
  encouragement: string
}

interface SelfCheckTabProps {
  userId: string
  practiceId: string
}

const DIMENSIONS = [
  {
    key: "energy_level",
    label: "Energielevel",
    icon: Zap,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    description: "Wie energiegeladen fühlen Sie sich?",
    lowLabel: "Erschöpft",
    highLabel: "Voller Energie",
  },
  {
    key: "stress_level",
    label: "Stresslevel",
    icon: Brain,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    description: "Wie gestresst fühlen Sie sich? (niedriger ist besser)",
    lowLabel: "Entspannt",
    highLabel: "Sehr gestresst",
    inverted: true,
  },
  {
    key: "work_satisfaction",
    label: "Arbeitszufriedenheit",
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    description: "Wie zufrieden sind Sie mit Ihrer Arbeit?",
    lowLabel: "Unzufrieden",
    highLabel: "Sehr zufrieden",
  },
  {
    key: "team_harmony",
    label: "Team-Harmonie",
    icon: Users,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Wie harmonisch ist die Zusammenarbeit im Team?",
    lowLabel: "Angespannt",
    highLabel: "Sehr harmonisch",
  },
  {
    key: "work_life_balance",
    label: "Work-Life-Balance",
    icon: Scale,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "Wie gut ist Ihre Work-Life-Balance?",
    lowLabel: "Unausgeglichen",
    highLabel: "Perfekt ausgeglichen",
  },
  {
    key: "motivation",
    label: "Motivation",
    icon: Target,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    description: "Wie motiviert fühlen Sie sich?",
    lowLabel: "Unmotiviert",
    highLabel: "Hoch motiviert",
  },
  {
    key: "overall_wellbeing",
    label: "Allgemeines Wohlbefinden",
    icon: Smile,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    description: "Wie würden Sie Ihr allgemeines Wohlbefinden bewerten?",
    lowLabel: "Schlecht",
    highLabel: "Ausgezeichnet",
  },
]

// Helper to get week info
const getWeekInfo = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return {
    start,
    end,
    label: `KW ${format(date, "w", { locale: de })}`,
    dateRange: `${format(start, "dd.MM.", { locale: de })} - ${format(end, "dd.MM.yyyy", { locale: de })}`,
  }
}

export function SelfCheckTab({ userId, practiceId }: SelfCheckTabProps) {
  const { toast } = useToast()
  const [activeSubTab, setActiveSubTab] = useState("weekly")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [history, setHistory] = useState<SelfCheckData[]>([])
  const [currentAssessment, setCurrentAssessment] = useState<Record<string, number | null>>({
    energy_level: null,
    stress_level: null,
    work_satisfaction: null,
    team_harmony: null,
    work_life_balance: null,
    motivation: null,
    overall_wellbeing: null,
  })
  const [notes, setNotes] = useState("")
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendations | null>(null)
  const [savedAssessmentId, setSavedAssessmentId] = useState<string | null>(null)
  
  // New state for card-based UI
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date())
  const [selectedCard, setSelectedCard] = useState<{ dimension: typeof DIMENSIONS[0]; data: SelfCheckData | null } | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingDimension, setEditingDimension] = useState<typeof DIMENSIONS[0] | null>(null)
  const [editValue, setEditValue] = useState<number>(5)

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${userId}/self-checks?limit=52`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data)

        // Check if there's an assessment for today
        const today = new Date().toISOString().split("T")[0]
        const todayAssessment = data.find((a: SelfCheckData) => a.assessment_date === today)
        if (todayAssessment) {
          setCurrentAssessment({
            energy_level: todayAssessment.energy_level,
            stress_level: todayAssessment.stress_level,
            work_satisfaction: todayAssessment.work_satisfaction,
            team_harmony: todayAssessment.team_harmony,
            work_life_balance: todayAssessment.work_life_balance,
            motivation: todayAssessment.motivation,
            overall_wellbeing: todayAssessment.overall_wellbeing,
          })
          setNotes(todayAssessment.notes || "")
          setSavedAssessmentId(todayAssessment.id)
          if (todayAssessment.ai_recommendations) {
            setAiRecommendations(todayAssessment.ai_recommendations)
          }
        }
      }
    } catch (error) {
      console.error("Error loading self-check history:", error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleSave = async () => {
    console.log("[v0] handleSave called", { userId, practiceId })

    // Check if at least one dimension is filled
    const hasData = Object.values(currentAssessment).some((v) => v !== null)
    if (!hasData) {
      toast({
        title: "Keine Daten",
        description: "Bitte bewerten Sie mindestens eine Dimension.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        practice_id: practiceId,
        ...currentAssessment,
        notes,
      }
      console.log("[v0] Sending POST request", {
        url: `/api/users/${userId}/self-checks`,
        payload,
      })

      const response = await fetch(`/api/users/${userId}/self-checks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("[v0] Response received", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      })

      const responseData = await response.json()
      console.log("[v0] Response data", responseData)

      if (!response.ok) {
        console.error("[v0] Save failed", responseData)
        throw new Error(responseData.error || responseData.message || "Failed to save")
      }

      setSavedAssessmentId(responseData.id)

      toast({
        title: "Gespeichert",
        description: "Ihre Selbsteinschätzung wurde erfolgreich gespeichert.",
      })

      await loadHistory()
    } catch (error) {
      console.error("[v0] Error saving self-check:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Die Selbsteinschätzung konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      console.log("[v0] handleSave completed")
    }
  }

  const handleGenerateAI = async () => {
    const hasData = Object.values(currentAssessment).some((v) => v !== null)
    if (!hasData) {
      toast({
        title: "Keine Daten",
        description: "Bitte füllen Sie zuerst die Selbsteinschätzung aus.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingAI(true)
    try {
      const response = await fetch(`/api/users/${userId}/self-checks/ai-recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentAssessment,
          assessment_id: savedAssessmentId,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate")

      const data = await response.json()
      setAiRecommendations(data)

      toast({
        title: "KI-Empfehlungen generiert",
        description: "Personalisierte Empfehlungen wurden erstellt.",
      })
    } catch (error) {
      console.error("Error generating AI recommendations:", error)
      toast({
        title: "Fehler",
        description: "KI-Empfehlungen konnten nicht generiert werden.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const calculateOverallScore = () => {
    const values = DIMENSIONS.map((d) => {
      const value = currentAssessment[d.key]
      if (value === null) return null
      return d.inverted ? 11 - value : value
    }).filter((v) => v !== null) as number[]

    if (values.length === 0) return null
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground"
    if (score >= 7) return "text-emerald-500"
    if (score >= 5) return "text-amber-500"
    return "text-red-500"
  }

  const getScoreBadge = (score: number | null) => {
    if (score === null) return { label: "Nicht bewertet", variant: "secondary" as const }
    if (score >= 8) return { label: "Ausgezeichnet", variant: "default" as const }
    if (score >= 6) return { label: "Gut", variant: "default" as const }
    if (score >= 4) return { label: "Verbesserungswürdig", variant: "secondary" as const }
    return { label: "Kritisch", variant: "destructive" as const }
  }

  const getTrendIcon = (current: number | null, previous: number | null) => {
    if (current === null || previous === null) return <Minus className="h-4 w-4 text-muted-foreground" />
    if (current > previous) return <TrendingUp className="h-4 w-4 text-emerald-500" />
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  // Prepare chart data
  const radarData = DIMENSIONS.map((d) => {
    const value = currentAssessment[d.key]
    return {
      dimension: d.label.split(" ")[0],
      value: value !== null ? (d.inverted ? 11 - value : value) : 0,
      fullMark: 10,
    }
  })

  const historyChartData = history
    .slice(0, 12)
    .reverse()
    .map((h) => ({
      date: new Date(h.assessment_date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      score: h.overall_score,
      energy: h.energy_level,
      stress: h.stress_level ? 11 - h.stress_level : null,
      satisfaction: h.work_satisfaction,
      motivation: h.motivation,
    }))

  const overallScore = calculateOverallScore()
  const scoreBadge = getScoreBadge(overallScore)
  const previousAssessment = history[1]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with overall status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Score Card */}
        <Card className="md:col-span-2 bg-gradient-to-br from-background to-muted/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Mentaler Wellness-Index</CardTitle>
                  <CardDescription>Ihre aktuelle Gesamtbewertung</CardDescription>
                </div>
              </div>
              <Badge variant={scoreBadge.variant}>{scoreBadge.label}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className={cn("text-5xl font-bold tabular-nums", getScoreColor(overallScore))}>
                  {overallScore !== null ? overallScore.toFixed(1) : "—"}
                </div>
                <div className="text-sm text-muted-foreground">/10</div>
              </div>
              <div className="flex-1">
                <Progress value={overallScore !== null ? overallScore * 10 : 0} className="h-3" />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>Kritisch</span>
                  <span>Optimal</span>
                </div>
              </div>
              {previousAssessment && (
                <div className="flex items-center gap-2 text-sm">
                  {getTrendIcon(overallScore, previousAssessment.overall_score)}
                  <span className="text-muted-foreground">vs. letzte Woche</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Statistik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Einträge</span>
              <span className="font-semibold">{history.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Streak</span>
              <span className="font-semibold">{Math.min(history.length, 4)} Wochen</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Nächste Erinnerung</span>
              <span className="font-semibold text-primary">Freitag</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assessment" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Selbsteinschätzung</span>
            <span className="sm:hidden">Check</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">KI-Empfehlungen</span>
            <span className="sm:hidden">KI</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Verlauf</span>
            <span className="sm:hidden">Verlauf</span>
          </TabsTrigger>
        </TabsList>

        {/* Assessment Tab */}
        <TabsContent value="assessment" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Wöchentliche Selbsteinschätzung
                  </CardTitle>
                  <CardDescription>Bewerten Sie Ihr aktuelles Befinden auf einer Skala von 1-10</CardDescription>
                </div>
                <Badge variant="outline">
                  {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {DIMENSIONS.map((dimension) => {
                const Icon = dimension.icon
                const value = currentAssessment[dimension.key]

                return (
                  <div key={dimension.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", dimension.bgColor)}>
                          <Icon className={cn("h-5 w-5", dimension.color)} />
                        </div>
                        <div>
                          <div className="font-medium">{dimension.label}</div>
                          <div className="text-sm text-muted-foreground">{dimension.description}</div>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "text-2xl font-bold tabular-nums min-w-[3rem] text-right",
                          value !== null ? dimension.color : "text-muted-foreground",
                        )}
                      >
                        {value !== null ? value : "—"}
                      </div>
                    </div>
                    <div className="px-2">
                      <Slider
                        value={value !== null ? [value] : [5]}
                        onValueChange={([v]) => setCurrentAssessment((prev) => ({ ...prev, [dimension.key]: v }))}
                        min={1}
                        max={10}
                        step={1}
                        className="cursor-pointer"
                      />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>{dimension.lowLabel}</span>
                        <span>{dimension.highLabel}</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Notes */}
              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">Persönliche Notizen (optional)</label>
                <Textarea
                  placeholder="Gibt es etwas, das Sie diese Woche besonders beeinflusst hat?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Einschätzung speichern
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI || !Object.values(currentAssessment).some((v) => v !== null)}
                  className="flex-1"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analysiere...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      KI-Empfehlungen generieren
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Wellness-Profil</CardTitle>
              <CardDescription>Visualisierung Ihrer aktuellen Bewertungen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 10]}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    />
                    <Radar
                      name="Aktuell"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6 mt-6">
          {aiRecommendations ? (
            <>
              {/* Overall Assessment */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    KI-Analyse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-foreground">{aiRecommendations.overall_assessment}</p>
                  <div className="p-4 rounded-lg bg-background/50 border">
                    <p className="text-sm italic text-muted-foreground">"{aiRecommendations.encouragement}"</p>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Personalisierte Empfehlungen
                </h3>
                {aiRecommendations.recommendations.map((rec, index) => {
                  const dimension = DIMENSIONS.find((d) => d.key === rec.dimension)
                  const Icon = dimension?.icon || Info

                  return (
                    <Card
                      key={index}
                      className={cn(
                        "border-l-4",
                        rec.priority === "high"
                          ? "border-l-red-500"
                          : rec.priority === "medium"
                            ? "border-l-amber-500"
                            : "border-l-green-500",
                      )}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", dimension?.bgColor || "bg-muted")}>
                              <Icon className={cn("h-5 w-5", dimension?.color || "text-foreground")} />
                            </div>
                            <div>
                              <CardTitle className="text-base">{rec.title}</CardTitle>
                              <CardDescription>{dimension?.label || rec.dimension}</CardDescription>
                            </div>
                          </div>
                          <Badge
                            variant={
                              rec.priority === "high"
                                ? "destructive"
                                : rec.priority === "medium"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {rec.priority === "high"
                              ? "Hohe Priorität"
                              : rec.priority === "medium"
                                ? "Mittlere Priorität"
                                : "Niedrige Priorität"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        {rec.actionable_steps && rec.actionable_steps.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Konkrete Schritte:</p>
                            <ul className="space-y-2">
                              {rec.actionable_steps.map((step, stepIndex) => (
                                <li key={stepIndex} className="flex items-start gap-2 text-sm">
                                  <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Regenerate Button */}
              <div className="flex justify-center">
                <Button variant="outline" onClick={handleGenerateAI} disabled={isGeneratingAI}>
                  {isGeneratingAI ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Neue Empfehlungen generieren
                </Button>
              </div>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Keine KI-Empfehlungen vorhanden</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  Füllen Sie zuerst die Selbsteinschätzung aus und klicken Sie auf "KI-Empfehlungen generieren", um
                  personalisierte Verbesserungsvorschläge zu erhalten.
                </p>
                <Button onClick={() => setActiveSubTab("assessment")}>Zur Selbsteinschätzung</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6 mt-6">
          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Wellness-Verlauf</CardTitle>
              <CardDescription>Entwicklung Ihres mentalen Wohlbefindens über Zeit</CardDescription>
            </CardHeader>
            <CardContent>
              {historyChartData.length > 1 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyChartData}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="score"
                        name="Gesamtscore"
                        stroke="hsl(var(--primary))"
                        fill="url(#scoreGradient)"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="energy"
                        name="Energie"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="motivation"
                        name="Motivation"
                        stroke="#10b981"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Noch nicht genügend Daten für einen Verlauf. Führen Sie regelmäßig Selbsteinschätzungen durch.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Frühere Einschätzungen</CardTitle>
              <CardDescription>{history.length} Einträge</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "p-2 rounded-full",
                            entry.overall_score && entry.overall_score >= 7
                              ? "bg-emerald-500/10"
                              : entry.overall_score && entry.overall_score >= 5
                                ? "bg-amber-500/10"
                                : "bg-red-500/10",
                          )}
                        >
                          {entry.overall_score && entry.overall_score >= 7 ? (
                            <Smile className="h-5 w-5 text-emerald-500" />
                          ) : entry.overall_score && entry.overall_score >= 5 ? (
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {new Date(entry.assessment_date).toLocaleDateString("de-DE", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {entry.notes ? entry.notes.substring(0, 50) + "..." : "Keine Notizen"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={cn("text-2xl font-bold tabular-nums", getScoreColor(entry.overall_score))}>
                          {entry.overall_score?.toFixed(1) || "—"}
                        </div>
                        {entry.ai_recommendations && (
                          <Badge variant="outline" className="gap-1">
                            <Sparkles className="h-3 w-3" />
                            KI
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Noch keine Einschätzungen vorhanden. Starten Sie jetzt mit Ihrer ersten Selbsteinschätzung.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

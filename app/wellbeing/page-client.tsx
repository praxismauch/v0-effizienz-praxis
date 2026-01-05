"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import AppLayout from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  Heart,
  Brain,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Send,
  Award,
  Coffee,
  Smile,
  Frown,
  Meh,
  Activity,
  BarChart3,
  MessageSquare,
  Lightbulb,
  Shield,
  Clock,
  RefreshCw,
  Plus,
  EyeOff,
  Zap,
  HandHeart,
  PartyPopper,
  Target,
  ChevronRight,
} from "lucide-react"
import { format, startOfWeek } from "date-fns"
import { de } from "date-fns/locale"

interface MoodSurvey {
  id: string
  title: string
  description: string
  survey_type: string
  is_active: boolean
  start_date: string
  end_date: string | null
  response_count?: number
}

interface MoodResponse {
  energy_level: number
  stress_level: number
  work_satisfaction: number
  team_harmony: number
  work_life_balance: number
  leadership_support: number
  growth_opportunities: number
  workload_fairness: number
}

interface WorkloadAnalysis {
  id: string
  analysis_period_start: string
  analysis_period_end: string
  avg_weekly_hours: number
  overtime_percentage: number
  sick_leave_rate: number
  vacation_usage_rate: number
  burnout_risk_score: number
  risk_factors: string[]
  ai_insights: string
  ai_recommendations: Array<{
    title: string
    description: string
    priority: string
  }>
}

interface WellbeingSuggestion {
  id: string
  category: string
  title: string
  description: string
  effort_level: string
  impact_level: string
  estimated_cost: string
  implementation_tips: string[]
  is_implemented: boolean
}

interface Kudos {
  id: string
  from_user_id: string
  from_user_name?: string
  from_user_avatar?: string
  to_user_id: string
  to_user_name?: string
  to_user_avatar?: string
  category: string
  message: string
  is_public: boolean
  is_anonymous: boolean
  reactions: Record<string, number>
  created_at: string
}

interface TeamMember {
  id: string
  name: string
  avatar?: string
  email?: string
}

const KUDOS_CATEGORIES = [
  { value: "teamwork", label: "Teamarbeit", icon: Users, color: "bg-blue-500" },
  { value: "innovation", label: "Innovation", icon: Lightbulb, color: "bg-purple-500" },
  { value: "helpfulness", label: "Hilfsbereitschaft", icon: HandHeart, color: "bg-pink-500" },
  { value: "customer_service", label: "Patientenservice", icon: Heart, color: "bg-red-500" },
  { value: "reliability", label: "Zuverlässigkeit", icon: Shield, color: "bg-green-500" },
  { value: "positivity", label: "Positive Energie", icon: Sparkles, color: "bg-yellow-500" },
  { value: "leadership", label: "Führung", icon: Target, color: "bg-indigo-500" },
  { value: "growth", label: "Weiterentwicklung", icon: TrendingUp, color: "bg-teal-500" },
]

const SUGGESTION_CATEGORIES = [
  { value: "work_life_balance", label: "Work-Life-Balance", icon: Coffee },
  { value: "stress_reduction", label: "Stressreduktion", icon: Brain },
  { value: "team_building", label: "Teambuilding", icon: Users },
  { value: "communication", label: "Kommunikation", icon: MessageSquare },
  { value: "recognition", label: "Anerkennung", icon: Award },
  { value: "flexibility", label: "Flexibilität", icon: Clock },
  { value: "health", label: "Gesundheit", icon: Activity },
  { value: "growth", label: "Entwicklung", icon: TrendingUp },
]

export default function WellbeingPageClient() {
  const { user, currentPractice } = useUser()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)

  // State for mood surveys
  const [surveys, setSurveys] = useState<MoodSurvey[]>([])
  const [showSurveyDialog, setShowSurveyDialog] = useState(false)
  const [activeSurvey, setActiveSurvey] = useState<MoodSurvey | null>(null)

  // State for mood response form
  const [moodResponse, setMoodResponse] = useState<MoodResponse>({
    energy_level: 3,
    stress_level: 3,
    work_satisfaction: 3,
    team_harmony: 3,
    work_life_balance: 3,
    leadership_support: 3,
    growth_opportunities: 3,
    workload_fairness: 3,
  })
  const [positiveFeedback, setPositiveFeedback] = useState("")
  const [improvementSuggestions, setImprovementSuggestions] = useState("")
  const [concerns, setConcerns] = useState("")
  const [isSubmittingMood, setIsSubmittingMood] = useState(false)
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false)

  // State for workload analysis
  const [workloadAnalysis, setWorkloadAnalysis] = useState<WorkloadAnalysis | null>(null)
  const [isAnalyzingWorkload, setIsAnalyzingWorkload] = useState(false)

  // State for suggestions
  const [suggestions, setSuggestions] = useState<WellbeingSuggestion[]>([])
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)

  // State for kudos
  const [kudosList, setKudosList] = useState<Kudos[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [showKudosDialog, setShowKudosDialog] = useState(false)
  const [kudosForm, setKudosForm] = useState({
    to_user_id: "",
    category: "",
    message: "",
    is_anonymous: false,
  })
  const [isSubmittingKudos, setIsSubmittingKudos] = useState(false)

  // Aggregated mood data for charts
  const [moodTrends, setMoodTrends] = useState<any[]>([])
  const [moodAverages, setMoodAverages] = useState<MoodResponse | null>(null)

  // Load initial data
  useEffect(() => {
    if (currentPractice?.id) {
      loadAllData()
    }
  }, [currentPractice?.id])

  const loadAllData = async () => {
    setIsLoading(true)
    await Promise.all([
      loadSurveys(),
      loadMoodData(),
      loadWorkloadAnalysis(),
      loadSuggestions(),
      loadKudos(),
      loadTeamMembers(),
    ])
    setIsLoading(false)
  }

  const loadSurveys = async () => {
    try {
      const res = await fetch(`/api/practices/${currentPractice?.id}/wellbeing/surveys`)
      if (res.ok) {
        const data = await res.json()
        setSurveys(data.surveys || [])
        // Find active survey
        const active = data.surveys?.find((s: MoodSurvey) => s.is_active)
        setActiveSurvey(active || null)
      }
    } catch (error) {
      console.error("Error loading surveys:", error)
    }
  }

  const loadMoodData = async () => {
    try {
      const res = await fetch(`/api/practices/${currentPractice?.id}/wellbeing/mood-data`)
      if (res.ok) {
        const data = await res.json()
        setMoodTrends(data.trends || [])
        setMoodAverages(data.averages || null)
        setHasSubmittedToday(data.hasSubmittedToday || false)
      }
    } catch (error) {
      console.error("Error loading mood data:", error)
    }
  }

  const loadWorkloadAnalysis = async () => {
    try {
      const res = await fetch(`/api/practices/${currentPractice?.id}/wellbeing/workload-analysis`)
      if (res.ok) {
        const data = await res.json()
        setWorkloadAnalysis(data.analysis || null)
      }
    } catch (error) {
      console.error("Error loading workload analysis:", error)
    }
  }

  const loadSuggestions = async () => {
    try {
      const res = await fetch(`/api/practices/${currentPractice?.id}/wellbeing/suggestions`)
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error("Error loading suggestions:", error)
    }
  }

  const loadKudos = async () => {
    try {
      const res = await fetch(`/api/practices/${currentPractice?.id}/wellbeing/kudos`)
      if (res.ok) {
        const data = await res.json()
        setKudosList(data.kudos || [])
      }
    } catch (error) {
      console.error("Error loading kudos:", error)
    }
  }

  const loadTeamMembers = async () => {
    try {
      const res = await fetch(`/api/practices/${currentPractice?.id}/team-members`)
      if (res.ok) {
        const data = await res.json()
        setTeamMembers(data || [])
      }
    } catch (error) {
      console.error("Error loading team members:", error)
    }
  }

  const handleSubmitMoodResponse = async () => {
    if (!currentPractice?.id) return

    setIsSubmittingMood(true)
    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/wellbeing/mood-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          survey_id: activeSurvey?.id,
          ...moodResponse,
          positive_feedback: positiveFeedback,
          improvement_suggestions: improvementSuggestions,
          concerns,
        }),
      })

      if (res.ok) {
        toast({
          title: "Feedback gesendet",
          description: "Vielen Dank für Ihr anonymes Feedback!",
        })
        setHasSubmittedToday(true)
        // Reset form
        setPositiveFeedback("")
        setImprovementSuggestions("")
        setConcerns("")
        loadMoodData()
      } else {
        throw new Error("Failed to submit")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Feedback konnte nicht gesendet werden.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingMood(false)
    }
  }

  const handleAnalyzeWorkload = async () => {
    if (!currentPractice?.id) return

    setIsAnalyzingWorkload(true)
    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/wellbeing/analyze-workload`, {
        method: "POST",
      })

      if (res.ok) {
        const data = await res.json()
        setWorkloadAnalysis(data.analysis)
        toast({
          title: "Analyse abgeschlossen",
          description: "Die Arbeitsbelastungs-Analyse wurde erstellt.",
        })
      } else {
        throw new Error("Failed to analyze")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Analyse konnte nicht durchgeführt werden.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzingWorkload(false)
    }
  }

  const handleGenerateSuggestions = async () => {
    if (!currentPractice?.id) return

    setIsGeneratingSuggestions(true)
    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/wellbeing/generate-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood_averages: moodAverages,
          workload_analysis: workloadAnalysis,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSuggestions([...suggestions, ...(data.suggestions || [])])
        toast({
          title: "Vorschläge generiert",
          description: "KI-basierte Wellbeing-Vorschläge wurden erstellt.",
        })
      } else {
        throw new Error("Failed to generate")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Vorschläge konnten nicht generiert werden.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingSuggestions(false)
    }
  }

  const handleSendKudos = async () => {
    if (!currentPractice?.id || !kudosForm.to_user_id || !kudosForm.category || !kudosForm.message) {
      toast({
        title: "Felder ausfüllen",
        description: "Bitte wählen Sie eine Person, Kategorie und schreiben Sie eine Nachricht.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingKudos(true)
    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/wellbeing/kudos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...kudosForm,
          from_user_id: user?.id,
        }),
      })

      if (res.ok) {
        toast({
          title: "Kudos gesendet!",
          description: "Ihre Anerkennung wurde gesendet.",
        })
        setShowKudosDialog(false)
        setKudosForm({
          to_user_id: "",
          category: "",
          message: "",
          is_anonymous: false,
        })
        loadKudos()
      } else {
        throw new Error("Failed to send kudos")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Kudos konnten nicht gesendet werden.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingKudos(false)
    }
  }

  const handleReactToKudos = async (kudosId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/practices/${currentPractice?.id}/wellbeing/kudos/${kudosId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      })

      if (res.ok) {
        loadKudos()
      }
    } catch (error) {
      console.error("Error reacting to kudos:", error)
    }
  }

  const getMoodIcon = (value: number) => {
    if (value >= 4) return <Smile className="h-5 w-5 text-green-500" />
    if (value >= 3) return <Meh className="h-5 w-5 text-yellow-500" />
    return <Frown className="h-5 w-5 text-red-500" />
  }

  const getMoodColor = (value: number) => {
    if (value >= 4) return "text-green-500"
    if (value >= 3) return "text-yellow-500"
    return "text-red-500"
  }

  const getBurnoutRiskColor = (score: number) => {
    if (score >= 70) return "bg-red-500"
    if (score >= 40) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getBurnoutRiskLabel = (score: number) => {
    if (score >= 70) return "Hohes Risiko"
    if (score >= 40) return "Mittleres Risiko"
    return "Geringes Risiko"
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Heart className="h-8 w-8 text-pink-500" />
              Mitarbeiter-Wellbeing
            </h1>
            <p className="text-muted-foreground mt-1">
              Burnout-Prävention, anonyme Stimmungsumfragen und Peer-Recognition
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowKudosDialog(true)}>
              <Award className="h-4 w-4 mr-2" />
              Kudos senden
            </Button>
            <Button onClick={handleGenerateSuggestions} disabled={isGeneratingSuggestions}>
              {isGeneratingSuggestions ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              KI-Vorschläge
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team-Stimmung</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getMoodIcon(moodAverages?.work_satisfaction || 0)}
                <span className={`text-2xl font-bold ${getMoodColor(moodAverages?.work_satisfaction || 0)}`}>
                  {moodAverages?.work_satisfaction?.toFixed(1) || "–"}
                </span>
                <span className="text-sm text-muted-foreground">/ 5</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Arbeitszufriedenheit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stress-Level</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getMoodIcon(6 - (moodAverages?.stress_level || 3))}
                <span className={`text-2xl font-bold ${getMoodColor(6 - (moodAverages?.stress_level || 3))}`}>
                  {moodAverages?.stress_level?.toFixed(1) || "–"}
                </span>
                <span className="text-sm text-muted-foreground">/ 5</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Durchschnittliches Stress-Level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Work-Life-Balance</CardTitle>
              <Coffee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getMoodIcon(moodAverages?.work_life_balance || 0)}
                <span className={`text-2xl font-bold ${getMoodColor(moodAverages?.work_life_balance || 0)}`}>
                  {moodAverages?.work_life_balance?.toFixed(1) || "–"}
                </span>
                <span className="text-sm text-muted-foreground">/ 5</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ausgewogenheit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kudos diese Woche</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {
                  kudosList.filter((k) => {
                    const created = new Date(k.created_at)
                    const weekStart = startOfWeek(new Date(), { locale: de })
                    return created >= weekStart
                  }).length
                }
              </div>
              <p className="text-xs text-muted-foreground mt-1">Anerkennungen</p>
            </CardContent>
          </Card>
        </div>

        {/* Burnout Risk Alert */}
        {workloadAnalysis && workloadAnalysis.burnout_risk_score >= 40 && (
          <Alert variant={workloadAnalysis.burnout_risk_score >= 70 ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Burnout-Risiko erkannt</AlertTitle>
            <AlertDescription>
              Die KI-Analyse zeigt ein {getBurnoutRiskLabel(workloadAnalysis.burnout_risk_score).toLowerCase()} für
              Burnout im Team. Klicken Sie auf den Tab "Arbeitsbelastung" für Details und Empfehlungen.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="mood">
              <Smile className="h-4 w-4 mr-2" />
              Stimmung
            </TabsTrigger>
            <TabsTrigger value="workload">
              <Activity className="h-4 w-4 mr-2" />
              Arbeitsbelastung
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              <Lightbulb className="h-4 w-4 mr-2" />
              Vorschläge
            </TabsTrigger>
            <TabsTrigger value="kudos">
              <Award className="h-4 w-4 mr-2" />
              Kudos
              {kudosList.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {kudosList.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Mood Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Stimmungs-Trends
                  </CardTitle>
                  <CardDescription>Entwicklung der Team-Stimmung über Zeit</CardDescription>
                </CardHeader>
                <CardContent>
                  {moodTrends.length > 0 ? (
                    <div className="space-y-4">
                      {["work_satisfaction", "stress_level", "team_harmony", "work_life_balance"].map((key) => {
                        const label = {
                          work_satisfaction: "Arbeitszufriedenheit",
                          stress_level: "Stress-Level",
                          team_harmony: "Team-Harmonie",
                          work_life_balance: "Work-Life-Balance",
                        }[key]
                        const value = moodAverages?.[key as keyof MoodResponse] || 0
                        const isStress = key === "stress_level"
                        const normalizedValue = isStress ? 6 - value : value

                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{label}</span>
                              <span className={getMoodColor(normalizedValue)}>{value.toFixed(1)} / 5</span>
                            </div>
                            <Progress
                              value={value * 20}
                              className={`h-2 ${isStress && value >= 4 ? "[&>div]:bg-red-500" : ""}`}
                            />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Meh className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Noch keine Stimmungsdaten vorhanden</p>
                      <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setActiveTab("mood")}>
                        Erste Umfrage starten
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Kudos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Letzte Kudos
                  </CardTitle>
                  <CardDescription>Peer-Recognition im Team</CardDescription>
                </CardHeader>
                <CardContent>
                  {kudosList.length > 0 ? (
                    <div className="space-y-4">
                      {kudosList.slice(0, 3).map((kudos) => {
                        const category = KUDOS_CATEGORIES.find((c) => c.value === kudos.category)
                        return (
                          <div key={kudos.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <div className={`p-2 rounded-full ${category?.color || "bg-gray-500"}`}>
                              {category?.icon && <category.icon className="h-4 w-4 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">
                                  {kudos.is_anonymous ? "Anonym" : kudos.from_user_name || "Unbekannt"}
                                </span>
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">{kudos.to_user_name || "Unbekannt"}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{kudos.message}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {category?.label || kudos.category}
                                </Badge>
                                {Object.entries(kudos.reactions || {}).map(([emoji, count]) => (
                                  <span key={emoji} className="text-xs">
                                    {emoji} {count}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <PartyPopper className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Noch keine Kudos vorhanden</p>
                      <Button
                        variant="outline"
                        className="mt-4 bg-transparent"
                        onClick={() => setShowKudosDialog(true)}
                      >
                        Ersten Kudos senden
                      </Button>
                    </div>
                  )}
                </CardContent>
                {kudosList.length > 3 && (
                  <CardFooter>
                    <Button variant="ghost" className="w-full" onClick={() => setActiveTab("kudos")}>
                      Alle Kudos anzeigen
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>

            {/* Workload Summary */}
            {workloadAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Arbeitsbelastungs-Zusammenfassung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold">{workloadAnalysis.avg_weekly_hours?.toFixed(1) || "–"}h</div>
                      <p className="text-sm text-muted-foreground">Ø Wochenstunden</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold">
                        {workloadAnalysis.overtime_percentage?.toFixed(0) || "–"}%
                      </div>
                      <p className="text-sm text-muted-foreground">Überstunden</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold">{workloadAnalysis.sick_leave_rate?.toFixed(1) || "–"}%</div>
                      <p className="text-sm text-muted-foreground">Krankenquote</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div
                        className={`text-2xl font-bold ${getBurnoutRiskColor(workloadAnalysis.burnout_risk_score)} text-white px-3 py-1 rounded`}
                      >
                        {workloadAnalysis.burnout_risk_score}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Burnout-Risiko</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Mood Survey Tab */}
          <TabsContent value="mood" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-500" />
                      Anonyme Stimmungsumfrage
                    </CardTitle>
                    <CardDescription>
                      Ihre Antworten sind vollständig anonym. Keine Rückverfolgung möglich.
                    </CardDescription>
                  </div>
                  {hasSubmittedToday && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Heute ausgefüllt
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {hasSubmittedToday ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Vielen Dank!</AlertTitle>
                    <AlertDescription>
                      Sie haben heute bereits Feedback gegeben. Die nächste Umfrage ist morgen verfügbar.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {/* Mood Sliders */}
                    <div className="grid gap-6 md:grid-cols-2">
                      {[
                        { key: "energy_level", label: "Energie-Level", desc: "Wie energiegeladen fühlen Sie sich?" },
                        { key: "stress_level", label: "Stress-Level", desc: "Wie gestresst fühlen Sie sich?" },
                        {
                          key: "work_satisfaction",
                          label: "Arbeitszufriedenheit",
                          desc: "Wie zufrieden sind Sie mit Ihrer Arbeit?",
                        },
                        { key: "team_harmony", label: "Team-Harmonie", desc: "Wie ist die Stimmung im Team?" },
                        {
                          key: "work_life_balance",
                          label: "Work-Life-Balance",
                          desc: "Wie gut ist Ihre Work-Life-Balance?",
                        },
                        {
                          key: "leadership_support",
                          label: "Führungsunterstützung",
                          desc: "Fühlen Sie sich von der Führung unterstützt?",
                        },
                        {
                          key: "growth_opportunities",
                          label: "Entwicklungsmöglichkeiten",
                          desc: "Sehen Sie Wachstumsmöglichkeiten?",
                        },
                        {
                          key: "workload_fairness",
                          label: "Faire Arbeitsverteilung",
                          desc: "Ist die Arbeit fair verteilt?",
                        },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="space-y-3">
                          <div className="flex justify-between">
                            <div>
                              <Label>{label}</Label>
                              <p className="text-xs text-muted-foreground">{desc}</p>
                            </div>
                            <span className={`font-medium ${getMoodColor(moodResponse[key as keyof MoodResponse])}`}>
                              {moodResponse[key as keyof MoodResponse]}
                            </span>
                          </div>
                          <Slider
                            value={[moodResponse[key as keyof MoodResponse]]}
                            onValueChange={([value]) => setMoodResponse({ ...moodResponse, [key]: value })}
                            min={1}
                            max={5}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Niedrig</span>
                            <span>Hoch</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Open Feedback */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="positive">Was läuft gut? (optional)</Label>
                        <Textarea
                          id="positive"
                          placeholder="Teilen Sie positive Erfahrungen..."
                          value={positiveFeedback}
                          onChange={(e) => setPositiveFeedback(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="improvements">Verbesserungsvorschläge (optional)</Label>
                        <Textarea
                          id="improvements"
                          placeholder="Was könnte verbessert werden?"
                          value={improvementSuggestions}
                          onChange={(e) => setImprovementSuggestions(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="concerns">Bedenken oder Sorgen (optional)</Label>
                        <Textarea
                          id="concerns"
                          placeholder="Gibt es etwas, das Sie besorgt?"
                          value={concerns}
                          onChange={(e) => setConcerns(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <EyeOff className="h-4 w-4" />
                        Vollständig anonym
                      </div>
                      <Button onClick={handleSubmitMoodResponse} disabled={isSubmittingMood}>
                        {isSubmittingMood ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Feedback senden
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workload Analysis Tab */}
          <TabsContent value="workload" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      KI-Arbeitsbelastungs-Analyse
                    </CardTitle>
                    <CardDescription>Erkennung von Überlastungsmustern und Burnout-Risiken</CardDescription>
                  </div>
                  <Button onClick={handleAnalyzeWorkload} disabled={isAnalyzingWorkload}>
                    {isAnalyzingWorkload ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Neue Analyse
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {workloadAnalysis ? (
                  <div className="space-y-6">
                    {/* Burnout Risk Score */}
                    <div className="text-center p-6 rounded-lg bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-2">Burnout-Risiko-Score</div>
                      <div
                        className={`inline-block text-4xl font-bold px-6 py-3 rounded-xl text-white ${getBurnoutRiskColor(workloadAnalysis.burnout_risk_score)}`}
                      >
                        {workloadAnalysis.burnout_risk_score}%
                      </div>
                      <div className="mt-2 text-sm font-medium">
                        {getBurnoutRiskLabel(workloadAnalysis.burnout_risk_score)}
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="p-4 rounded-lg border">
                        <div className="text-2xl font-bold">
                          {workloadAnalysis.avg_weekly_hours?.toFixed(1) || "–"}h
                        </div>
                        <p className="text-sm text-muted-foreground">Ø Wochenstunden</p>
                      </div>
                      <div className="p-4 rounded-lg border">
                        <div className="text-2xl font-bold">
                          {workloadAnalysis.overtime_percentage?.toFixed(0) || "–"}%
                        </div>
                        <p className="text-sm text-muted-foreground">Überstundenquote</p>
                      </div>
                      <div className="p-4 rounded-lg border">
                        <div className="text-2xl font-bold">{workloadAnalysis.sick_leave_rate?.toFixed(1) || "–"}%</div>
                        <p className="text-sm text-muted-foreground">Krankenquote</p>
                      </div>
                      <div className="p-4 rounded-lg border">
                        <div className="text-2xl font-bold">
                          {workloadAnalysis.vacation_usage_rate?.toFixed(0) || "–"}%
                        </div>
                        <p className="text-sm text-muted-foreground">Urlaubsnutzung</p>
                      </div>
                    </div>

                    {/* Risk Factors */}
                    {workloadAnalysis.risk_factors && workloadAnalysis.risk_factors.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          Erkannte Risikofaktoren
                        </h3>
                        <div className="space-y-2">
                          {workloadAnalysis.risk_factors.map((factor, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800"
                            >
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                              <span className="text-sm">{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Insights */}
                    {workloadAnalysis.ai_insights && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Brain className="h-5 w-5 text-purple-500" />
                          KI-Einschätzung
                        </h3>
                        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                          <p className="text-sm whitespace-pre-wrap">{workloadAnalysis.ai_insights}</p>
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {workloadAnalysis.ai_recommendations && workloadAnalysis.ai_recommendations.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-green-500" />
                          Empfehlungen
                        </h3>
                        <div className="space-y-3">
                          {workloadAnalysis.ai_recommendations.map((rec, idx) => (
                            <div key={idx} className="p-4 rounded-lg border">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium">{rec.title}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                                </div>
                                <Badge
                                  variant={
                                    rec.priority === "high"
                                      ? "destructive"
                                      : rec.priority === "medium"
                                        ? "default"
                                        : "secondary"
                                  }
                                >
                                  {rec.priority === "high" ? "Hoch" : rec.priority === "medium" ? "Mittel" : "Niedrig"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Activity className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Keine Analyse vorhanden</h3>
                    <p className="text-muted-foreground mb-4">
                      Starten Sie eine KI-Analyse, um Überlastungsmuster zu erkennen.
                    </p>
                    <Button onClick={handleAnalyzeWorkload} disabled={isAnalyzingWorkload}>
                      {isAnalyzingWorkload ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Analyse starten
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Work-Life-Balance Vorschläge</h2>
                <p className="text-sm text-muted-foreground">KI-generierte Maßnahmen für besseres Wohlbefinden</p>
              </div>
              <Button onClick={handleGenerateSuggestions} disabled={isGeneratingSuggestions}>
                {isGeneratingSuggestions ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Neue Vorschläge
              </Button>
            </div>

            {suggestions.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {suggestions.map((suggestion) => {
                  const category = SUGGESTION_CATEGORIES.find((c) => c.value === suggestion.category)
                  return (
                    <Card key={suggestion.id} className={suggestion.is_implemented ? "opacity-60" : ""}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {category?.icon && <category.icon className="h-5 w-5 text-primary" />}
                            <CardTitle className="text-base">{suggestion.title}</CardTitle>
                          </div>
                          {suggestion.is_implemented && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Umgesetzt
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{suggestion.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Zap className="h-4 w-4" />
                            <span>
                              Aufwand:{" "}
                              {suggestion.effort_level === "low"
                                ? "Gering"
                                : suggestion.effort_level === "medium"
                                  ? "Mittel"
                                  : "Hoch"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            <span>
                              Wirkung:{" "}
                              {suggestion.impact_level === "low"
                                ? "Gering"
                                : suggestion.impact_level === "medium"
                                  ? "Mittel"
                                  : "Hoch"}
                            </span>
                          </div>
                        </div>
                        {suggestion.estimated_cost && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Geschätzte Kosten: {suggestion.estimated_cost}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Badge variant="outline">{category?.label || suggestion.category}</Badge>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Lightbulb className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Noch keine Vorschläge</h3>
                  <p className="text-muted-foreground mb-4">
                    Lassen Sie die KI basierend auf Ihren Team-Daten Vorschläge generieren.
                  </p>
                  <Button onClick={handleGenerateSuggestions} disabled={isGeneratingSuggestions}>
                    {isGeneratingSuggestions ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Vorschläge generieren
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Kudos Tab */}
          <TabsContent value="kudos" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Peer-Recognition</h2>
                <p className="text-sm text-muted-foreground">Anerkennung und Wertschätzung im Team</p>
              </div>
              <Button onClick={() => setShowKudosDialog(true)}>
                <Award className="h-4 w-4 mr-2" />
                Kudos senden
              </Button>
            </div>

            {kudosList.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {kudosList.map((kudos) => {
                  const category = KUDOS_CATEGORIES.find((c) => c.value === kudos.category)
                  return (
                    <Card key={kudos.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${category?.color || "bg-gray-500"}`}>
                            {category?.icon && <category.icon className="h-5 w-5 text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm">
                              {kudos.is_anonymous ? (
                                <span className="text-muted-foreground">Anonym</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={kudos.from_user_avatar || "/placeholder.svg"} />
                                    <AvatarFallback>{kudos.from_user_name?.[0]}</AvatarFallback>
                                  </Avatar>
                                  <span>{kudos.from_user_name}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={kudos.to_user_avatar || "/placeholder.svg"} />
                                  <AvatarFallback>{kudos.to_user_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{kudos.to_user_name}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{kudos.message}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="outline" className="text-xs">
                            {category?.label || kudos.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(kudos.created_at), "dd. MMM", { locale: de })}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <div className="flex items-center gap-2">
                          {["❤️", "🎉", "👏", "🙌"].map((emoji) => (
                            <Button
                              key={emoji}
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => handleReactToKudos(kudos.id, emoji)}
                            >
                              {emoji}
                              {kudos.reactions?.[emoji] ? (
                                <span className="ml-1 text-xs">{kudos.reactions[emoji]}</span>
                              ) : null}
                            </Button>
                          ))}
                        </div>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <PartyPopper className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Noch keine Kudos</h3>
                  <p className="text-muted-foreground mb-4">Starten Sie die Peer-Recognition-Kultur in Ihrem Team!</p>
                  <Button onClick={() => setShowKudosDialog(true)}>
                    <Award className="h-4 w-4 mr-2" />
                    Ersten Kudos senden
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Kudos Dialog */}
        <Dialog open={showKudosDialog} onOpenChange={setShowKudosDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Kudos senden
              </DialogTitle>
              <DialogDescription>Zeigen Sie Anerkennung für Ihre Kolleg:innen</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>An wen?</Label>
                <Select
                  value={kudosForm.to_user_id}
                  onValueChange={(v) => setKudosForm({ ...kudosForm, to_user_id: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Team-Mitglied auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers
                      .filter((m) => m.id !== user?.id)
                      .map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={member.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{member.name?.[0]}</AvatarFallback>
                            </Avatar>
                            {member.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kategorie</Label>
                <Select value={kudosForm.category} onValueChange={(v) => setKudosForm({ ...kudosForm, category: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Kategorie auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {KUDOS_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${cat.color}`}>
                            <cat.icon className="h-3 w-3 text-white" />
                          </div>
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nachricht</Label>
                <Textarea
                  placeholder="Was möchten Sie sagen?"
                  value={kudosForm.message}
                  onChange={(e) => setKudosForm({ ...kudosForm, message: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={kudosForm.is_anonymous}
                  onChange={(e) => setKudosForm({ ...kudosForm, is_anonymous: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                  Anonym senden
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowKudosDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSendKudos} disabled={isSubmittingKudos}>
                {isSubmittingKudos ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Senden
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}

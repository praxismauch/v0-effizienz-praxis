"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import AppLayout from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Heart,
  Brain,
  Activity,
  BarChart3,
  Lightbulb,
  Coffee,
  Award,
  Smile,
  Frown,
  Meh,
  Sparkles,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import { startOfWeek } from "date-fns"
import { de } from "date-fns/locale"

import type {
  MoodSurvey,
  MoodResponse,
  WorkloadAnalysis,
  WellbeingSuggestion,
  Kudos,
  TeamMember,
  KudosForm,
} from "./types"
import { getBurnoutRiskLabel } from "./types"

import { OverviewTab } from "./components/overview-tab"
import { WorkloadTab } from "./components/workload-tab"
import { SuggestionsTab } from "./components/suggestions-tab"
import { KudosTab } from "./components/kudos-tab"
import { MoodSurveyDialog } from "./components/mood-survey-dialog"
import { KudosDialog } from "./components/kudos-dialog"

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
  const [kudosForm, setKudosForm] = useState<KudosForm>({
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
    } else {
      setIsLoading(false)
    }
  }, [currentPractice?.id])

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadSurveys(),
        loadMoodData(),
        loadWorkloadAnalysis(),
        loadSuggestions(),
        loadKudos(),
        loadTeamMembers(),
      ])
    } catch (error) {
      console.error("[v0] Error loading all data:", error)
    }
    setIsLoading(false)
  }

  const loadSurveys = async () => {
    try {
      const res = await fetch(`/api/practices/${currentPractice?.id}/wellbeing/surveys`)
      if (res.ok) {
        const data = await res.json()
        setSurveys(data.surveys || [])
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
        setTeamMembers(Array.isArray(data) ? data : data.teamMembers || [])
      }
    } catch (error) {
      console.error("Error loading team members:", error)
    }
  }

  const handleStartFirstSurvey = async () => {
    if (!currentPractice?.id) return
    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/wellbeing/surveys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Wöchentliche Stimmungsumfrage",
          description: "Anonyme Umfrage zur Team-Stimmung",
          survey_type: "weekly",
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setActiveSurvey(data.survey)
        setSurveys([data.survey, ...surveys])
        setShowSurveyDialog(true)
        toast({
          title: "Umfrage erstellt",
          description: "Die erste Stimmungsumfrage wurde gestartet.",
        })
      } else {
        throw new Error("Failed to create survey")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Umfrage konnte nicht erstellt werden.",
        variant: "destructive",
      })
      console.error("[v0] Error creating survey:", error)
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
        setShowSurveyDialog(false)
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
                  {moodAverages?.work_satisfaction?.toFixed(1) || "\u2013"}
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
                  {moodAverages?.stress_level?.toFixed(1) || "\u2013"}
                </span>
                <span className="text-sm text-muted-foreground">/ 5</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{"Durchschnittliches Stress-Level"}</p>
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
                  {moodAverages?.work_life_balance?.toFixed(1) || "\u2013"}
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
              {"Die KI-Analyse zeigt ein "}
              {getBurnoutRiskLabel(workloadAnalysis.burnout_risk_score).toLowerCase()}
              {" für Burnout im Team. Klicken Sie auf den Tab \"Arbeitsbelastung\" für Details und Empfehlungen."}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              {"Übersicht"}
            </TabsTrigger>
            <TabsTrigger value="workload">
              <Activity className="h-4 w-4 mr-2" />
              Arbeitsbelastung
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              <Lightbulb className="h-4 w-4 mr-2" />
              {"Vorschläge"}
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
            <OverviewTab
              moodTrends={moodTrends}
              moodAverages={moodAverages}
              kudosList={kudosList}
              workloadAnalysis={workloadAnalysis}
              onStartFirstSurvey={handleStartFirstSurvey}
              onShowKudosDialog={() => setShowKudosDialog(true)}
              onSwitchToKudosTab={() => setActiveTab("kudos")}
            />
          </TabsContent>

          {/* Workload Analysis Tab */}
          <TabsContent value="workload" className="space-y-6">
            <WorkloadTab
              workloadAnalysis={workloadAnalysis}
              isAnalyzingWorkload={isAnalyzingWorkload}
              onAnalyzeWorkload={handleAnalyzeWorkload}
            />
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-6">
            <SuggestionsTab
              suggestions={suggestions}
              isGeneratingSuggestions={isGeneratingSuggestions}
              onGenerateSuggestions={handleGenerateSuggestions}
            />
          </TabsContent>

          {/* Kudos Tab */}
          <TabsContent value="kudos" className="space-y-6">
            <KudosTab
              kudosList={kudosList}
              onShowKudosDialog={() => setShowKudosDialog(true)}
              onReactToKudos={handleReactToKudos}
            />
          </TabsContent>
        </Tabs>

        {/* Mood Survey Dialog */}
        <MoodSurveyDialog
          open={showSurveyDialog}
          onOpenChange={setShowSurveyDialog}
          moodResponse={moodResponse}
          onMoodResponseChange={setMoodResponse}
          positiveFeedback={positiveFeedback}
          onPositiveFeedbackChange={setPositiveFeedback}
          improvementSuggestions={improvementSuggestions}
          onImprovementSuggestionsChange={setImprovementSuggestions}
          concerns={concerns}
          onConcernsChange={setConcerns}
          isSubmitting={isSubmittingMood}
          hasSubmittedToday={hasSubmittedToday}
          onSubmit={handleSubmitMoodResponse}
        />

        {/* Kudos Dialog */}
        <KudosDialog
          open={showKudosDialog}
          onOpenChange={setShowKudosDialog}
          kudosForm={kudosForm}
          onKudosFormChange={setKudosForm}
          teamMembers={teamMembers}
          currentUserId={user?.id}
          isSubmitting={isSubmittingKudos}
          onSubmit={handleSendKudos}
        />
      </div>
    </AppLayout>
  )
}

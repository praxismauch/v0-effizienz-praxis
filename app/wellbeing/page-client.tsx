"use client"

import { useState } from "react"
import { useUser } from "@/contexts/user-context"
import AppLayout from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { getBurnoutRiskLabel } from "./types"
import { OverviewTab } from "./components/overview-tab"
import { WorkloadTab } from "./components/workload-tab"
import { SuggestionsTab } from "./components/suggestions-tab"
import { KudosTab } from "./components/kudos-tab"
import { MoodSurveyDialog } from "./components/mood-survey-dialog"
import { KudosDialog } from "./components/kudos-dialog"
import { PageHeader } from "@/components/page-layout"
import { useWellbeing } from "./hooks/use-wellbeing"

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMoodIcon(value: number) {
  if (value >= 4) return <Smile className="h-5 w-5 text-green-500" />
  if (value >= 3) return <Meh className="h-5 w-5 text-yellow-500" />
  return <Frown className="h-5 w-5 text-red-500" />
}

function getMoodColor(value: number) {
  if (value >= 4) return "text-green-500"
  if (value >= 3) return "text-yellow-500"
  return "text-red-500"
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function WellbeingPageClient() {
  const { user, currentPractice } = useUser()

  const [activeTab, setActiveTab] = useState("overview")
  const [showSurveyDialog, setShowSurveyDialog] = useState(false)
  const [showKudosDialog, setShowKudosDialog] = useState(false)

  const {
    isLoading,
    moodResponse, setMoodResponse,
    positiveFeedback, setPositiveFeedback,
    improvementSuggestions, setImprovementSuggestions,
    concerns, setConcerns,
    isSubmittingMood,
    hasSubmittedToday,
    workloadAnalysis,
    isAnalyzingWorkload,
    suggestions,
    isGeneratingSuggestions,
    kudosList,
    teamMembers,
    kudosForm, setKudosForm,
    isSubmittingKudos,
    moodTrends,
    moodAverages,
    handleSubmitMoodResponse,
    handleAnalyzeWorkload,
    handleGenerateSuggestions,
    handleSendKudos,
    handleReactToKudos,
  } = useWellbeing({ practiceId: currentPractice?.id, userId: user?.id })

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    )
  }

  const weeklyKudosCount = kudosList.filter((k) => {
    const created = new Date(k.created_at)
    const weekStart = startOfWeek(new Date(), { locale: de })
    return created >= weekStart
  }).length

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <PageHeader
          title="Mitarbeiter-Wellbeing"
          subtitle="Burnout-Praevention, anonyme Stimmungsumfragen und Peer-Recognition"
          icon={<Heart className="h-8 w-8 text-pink-500" />}
          actions={
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
                KI-Vorschlaege
              </Button>
            </div>
          }
        />

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
              <div className="text-2xl font-bold text-primary">{weeklyKudosCount}</div>
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
              {kudosList.length > 0 && <Badge variant="secondary" className="ml-2">{kudosList.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTab
              moodTrends={moodTrends} moodAverages={moodAverages}
              kudosList={kudosList} workloadAnalysis={workloadAnalysis}
              onStartFirstSurvey={() => setShowSurveyDialog(true)}
              onShowKudosDialog={() => setShowKudosDialog(true)}
              onSwitchToKudosTab={() => setActiveTab("kudos")}
            />
          </TabsContent>

          <TabsContent value="workload" className="space-y-6">
            <WorkloadTab workloadAnalysis={workloadAnalysis} isAnalyzingWorkload={isAnalyzingWorkload} onAnalyzeWorkload={handleAnalyzeWorkload} />
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-6">
            <SuggestionsTab suggestions={suggestions} isGeneratingSuggestions={isGeneratingSuggestions} onGenerateSuggestions={handleGenerateSuggestions} />
          </TabsContent>

          <TabsContent value="kudos" className="space-y-6">
            <KudosTab kudosList={kudosList} onShowKudosDialog={() => setShowKudosDialog(true)} onReactToKudos={handleReactToKudos} />
          </TabsContent>
        </Tabs>

        <MoodSurveyDialog
          open={showSurveyDialog} onOpenChange={setShowSurveyDialog}
          moodResponse={moodResponse} onMoodResponseChange={setMoodResponse}
          positiveFeedback={positiveFeedback} onPositiveFeedbackChange={setPositiveFeedback}
          improvementSuggestions={improvementSuggestions} onImprovementSuggestionsChange={setImprovementSuggestions}
          concerns={concerns} onConcernsChange={setConcerns}
          isSubmitting={isSubmittingMood} hasSubmittedToday={hasSubmittedToday}
          onSubmit={handleSubmitMoodResponse}
        />

        <KudosDialog
          open={showKudosDialog} onOpenChange={setShowKudosDialog}
          kudosForm={kudosForm} onKudosFormChange={setKudosForm}
          teamMembers={teamMembers} currentUserId={user?.id}
          isSubmitting={isSubmittingKudos} onSubmit={handleSendKudos}
        />
      </div>
    </AppLayout>
  )
}

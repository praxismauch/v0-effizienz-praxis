"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Search, Sparkles, ClipboardCheck, LayoutTemplate, Heart, Zap, Trash2 } from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { PageHeader } from "@/components/page-layout"
import Logger from "@/lib/logger"

import type { Survey, SurveyTemplate, MoodTrendData, MoodAlert, NewSurveyData, EditSurveyData } from "./types"
import { SurveyStatsCards } from "./components/survey-stats-cards"
import { SurveyCard } from "./components/survey-card"
import { MoodDashboard } from "./components/mood-dashboard"
import {
  CreateSurveyDialog,
  TemplateSelectionDialog,
  AIGenerationDialog,
  ResultsDialog,
  EditSurveyDialog,
} from "./components/survey-dialogs"

const DEFAULT_NEW_SURVEY: NewSurveyData = {
  title: "",
  description: "",
  survey_type: "internal",
  target_audience: "all",
  is_anonymous: false,
  start_date: "",
  end_date: "",
  notify_admin_on_response: false,
}

export default function SurveysPage() {
  const { currentPractice } = usePractice()
  const { toast } = useToast()

  const [surveys, setSurveys] = useState<Survey[]>([])
  const [templates, setTemplates] = useState<SurveyTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [showResultsDialog, setShowResultsDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Survey | null>(null)
  const [editSurveyData, setEditSurveyData] = useState<EditSurveyData>({
    title: "",
    description: "",
    target_audience: "all",
    is_anonymous: false,
    start_date: "",
    end_date: "",
  })
  const [isCreating, setIsCreating] = useState(false)
  const [aiPrompt, setAIPrompt] = useState("")
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [newSurvey, setNewSurvey] = useState<NewSurveyData>(DEFAULT_NEW_SURVEY)

  // Mood tracking state
  const [showMoodDashboard, setShowMoodDashboard] = useState(false)
  const [moodTrendData, setMoodTrendData] = useState<MoodTrendData[]>([])
  const [moodAlerts, setMoodAlerts] = useState<MoodAlert[]>([])
  const [isLoadingMoodData, setIsLoadingMoodData] = useState(false)
  const [selectedMoodPeriod, setSelectedMoodPeriod] = useState<"4weeks" | "8weeks" | "12weeks">("8weeks")

  // --- Data fetching ---

  const fetchSurveys = useCallback(async () => {
    if (!currentPractice?.id) return
    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/surveys`, { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setSurveys(data.surveys || [])
      }
    } catch (error) {
      Logger.error("api", "Error fetching surveys", error)
    } finally {
      setLoading(false)
    }
  }, [currentPractice?.id])

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch("/api/survey-templates", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      Logger.error("api", "Error fetching templates", error)
    }
  }, [])

  const fetchMoodData = useCallback(async () => {
    if (!currentPractice?.id) return
    setIsLoadingMoodData(true)
    try {
      const response = await fetch(
        `/api/practices/${currentPractice.id}/surveys/mood-tracking?period=${selectedMoodPeriod}`,
        { credentials: "include" },
      )
      if (response.ok) {
        const data = await response.json()
        setMoodTrendData(data.trends || [])
        setMoodAlerts(data.alerts || [])
      }
    } catch (error) {
      Logger.error("api", "Error fetching mood data", error)
    } finally {
      setIsLoadingMoodData(false)
    }
  }, [currentPractice?.id, selectedMoodPeriod])

  useEffect(() => {
    fetchSurveys()
    fetchTemplates()
  }, [fetchSurveys, fetchTemplates])

  useEffect(() => {
    if (showMoodDashboard) fetchMoodData()
  }, [showMoodDashboard, fetchMoodData])

  // --- Handlers ---

  const handleCreateSurvey = async () => {
    if (!currentPractice?.id || !newSurvey.title.trim()) return
    setIsCreating(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/surveys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newSurvey),
      })
      if (response.ok) {
        toast({ title: "Umfrage erstellt", description: "Die Umfrage wurde erfolgreich erstellt." })
        setShowCreateDialog(false)
        setNewSurvey(DEFAULT_NEW_SURVEY)
        await fetchSurveys()
      } else {
        const responseData = await response.json()
        throw new Error(`Failed to create survey: ${response.status} - ${responseData?.error || "Unknown error"}`)
      }
    } catch (error) {
      Logger.error("api", "Error creating survey", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Die Umfrage konnte nicht erstellt werden.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateFromTemplate = async (template: SurveyTemplate) => {
    if (!currentPractice?.id) return
    setIsCreating(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/surveys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: template.name,
          description: template.description,
          survey_type: template.category === "patient" ? "external" : "internal",
          target_audience: template.category === "patient" ? "patients" : "all",
          is_anonymous: template.category === "patient",
          questions: template.questions,
        }),
      })
      if (response.ok) {
        toast({ title: "Umfrage erstellt", description: "Die Umfrage wurde aus der Vorlage erstellt." })
        setShowTemplateDialog(false)
        fetchSurveys()
      } else {
        toast({ title: "Fehler", description: `Erstellen fehlgeschlagen: ${response.status}`, variant: "destructive" })
      }
    } catch (error) {
      Logger.error("api", "Error creating from template", error)
      toast({ title: "Fehler", description: "Die Umfrage konnte nicht erstellt werden.", variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }

  const handleCreateWeeklyMoodSurvey = async () => {
    if (!currentPractice?.id) return
    setIsCreating(true)
    try {
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      const response = await fetch(`/api/practices/${currentPractice.id}/surveys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: `Team Stimmungsbarometer - KW ${getWeekNumber(today)}`,
          description: "Wochentliche Kurzumfrage zur Team-Stimmung",
          survey_type: "internal",
          target_audience: "all",
          is_anonymous: true,
          start_date: today.toISOString().split("T")[0],
          end_date: nextWeek.toISOString().split("T")[0],
          notify_admin_on_response: true,
          questions: [
            { question_text: "Wie zufrieden bist du diese Woche mit deiner Arbeit?", question_type: "scale", is_required: true, order_index: 1 },
            { question_text: "Wie hoch ist dein aktuelles Stresslevel?", question_type: "scale", is_required: true, order_index: 2 },
            { question_text: "Wie gut fuhlst du dich im Team unterstutzt?", question_type: "scale", is_required: true, order_index: 3 },
          ],
        }),
      })
      if (response.ok) {
        toast({ title: "Stimmungsbarometer erstellt", description: "Die wochentliche Umfrage wurde erstellt." })
        fetchSurveys()
      }
    } catch {
      toast({ title: "Fehler", description: "Die Umfrage konnte nicht erstellt werden.", variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  const handleGenerateWithAI = async () => {
    if (!currentPractice?.id || !aiPrompt.trim()) return
    setIsGeneratingAI(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/surveys/ai-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      if (response.ok) {
        toast({ title: "Umfrage generiert", description: "Die KI hat eine Umfrage erstellt." })
        setShowAIDialog(false)
        setAIPrompt("")
        fetchSurveys()
      }
    } catch {
      toast({ title: "Fehler", description: "Die Umfrage konnte nicht generiert werden.", variant: "destructive" })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleDeleteSurvey = async (surveyId: string) => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/surveys/${surveyId}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (response.ok) {
        setSurveys(surveys.filter((s) => s.id !== surveyId))
        toast({ title: "Umfrage geloscht", description: "Die Umfrage wurde erfolgreich geloscht." })
      }
    } catch {
      toast({ title: "Fehler", description: "Die Umfrage konnte nicht geloscht werden.", variant: "destructive" })
    }
  }

  const handleDuplicateSurvey = async (survey: Survey) => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/surveys/${survey.id}/duplicate`, {
        method: "POST",
        credentials: "include",
      })
      if (response.ok) {
        toast({ title: "Umfrage dupliziert" })
        fetchSurveys()
      }
    } catch {
      toast({ title: "Fehler", description: "Duplizierung fehlgeschlagen.", variant: "destructive" })
    }
  }

  const handleToggleStatus = async (survey: Survey) => {
    if (!currentPractice?.id) return
    const newStatus = survey.status === "active" ? "closed" : "active"
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/surveys/${survey.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        setSurveys(surveys.map((s) => (s.id === survey.id ? { ...s, status: newStatus } : s)))
        toast({ title: newStatus === "active" ? "Umfrage aktiviert" : "Umfrage beendet" })
      }
    } catch {
      toast({ title: "Fehler", variant: "destructive" })
    }
  }

  const openEditDialog = async (survey: Survey) => {
    setSelectedSurvey(survey)
    setEditSurveyData({
      title: survey.title,
      description: survey.description || "",
      target_audience: survey.target_audience,
      is_anonymous: survey.is_anonymous || false,
      start_date: survey.start_date || "",
      end_date: survey.end_date || "",
      questions: [],
    })
    setShowEditDialog(true)

    // Fetch existing questions for this survey
    if (currentPractice?.id) {
      try {
        const response = await fetch(
          `/api/practices/${currentPractice.id}/surveys/${survey.id}/questions`,
          { credentials: "include" }
        )
        if (response.ok) {
          const data = await response.json()
          setEditSurveyData((prev) => ({ ...prev, questions: data.questions || [] }))
        }
      } catch (error) {
        Logger.error("api", "Error fetching survey questions", error)
      }
    }
  }

  const handleEditSurvey = async () => {
    if (!currentPractice?.id || !selectedSurvey) return
    setIsCreating(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/surveys/${selectedSurvey.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editSurveyData),
      })
      if (response.ok) {
        toast({ title: "Umfrage aktualisiert" })
        setShowEditDialog(false)
        fetchSurveys()
      } else {
        throw new Error("Update failed")
      }
    } catch {
      toast({ title: "Fehler", description: "Aktualisierung fehlgeschlagen.", variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  const copyPublicLink = (survey: Survey) => {
    if (survey.public_token) {
      const url = `${window.location.origin}/survey/${survey.public_token}`
      navigator.clipboard.writeText(url)
      toast({ title: "Link kopiert", description: "Der offentliche Link wurde kopiert." })
    }
  }

  // --- Computed ---

  const filteredSurveys = surveys.filter((survey) => {
    const matchesSearch =
      survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      survey.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === "all" || survey.status === activeTab
    return matchesSearch && matchesTab
  })

  const stats = useMemo(
    () => ({
      total: surveys.length,
      active: surveys.filter((s) => s.status === "active").length,
      totalResponses: surveys.reduce((sum, s) => sum + (s.response_count || 0), 0),
      avgResponseRate:
        surveys.length > 0
          ? Math.round(surveys.reduce((sum, s) => sum + (s.response_count || 0), 0) / surveys.length)
          : 0,
    }),
    [surveys],
  )

  // --- Render ---

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <PageHeader
            title="Umfragen"
            subtitle="Erstellen und verwalten Sie Umfragen für Ihr Team und Ihre Patienten"
            icon={<ClipboardCheck className="h-8 w-8" />}
            actions={
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowAIDialog(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Mit KI erstellen
                </Button>
                <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
                  <LayoutTemplate className="h-4 w-4 mr-2" />
                  Aus Vorlage
                </Button>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Umfrage
                </Button>
              </>
            }
          />

          <SurveyStatsCards stats={stats} />
        </div>

        {/* Tabs and Search */}
        <div className="border-y bg-muted/30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1">
                <TabsList className="w-full flex h-auto gap-1">
                  <TabsTrigger value="all" className="flex-1">Alle</TabsTrigger>
                  <TabsTrigger value="draft" className="flex-1">Entwurfe</TabsTrigger>
                  <TabsTrigger value="active" className="flex-1">Aktiv</TabsTrigger>
                  <TabsTrigger value="closed" className="flex-1">Beendet</TabsTrigger>
                  <TabsTrigger value="archived" className="flex-1">Archiv</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Umfrage suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8">
          {/* Mood Dashboard Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 mt-6">
            <div className="flex items-center gap-2">
              <Button
                variant={showMoodDashboard ? "default" : "outline"}
                onClick={() => setShowMoodDashboard(!showMoodDashboard)}
                className="gap-2"
              >
                <Heart className="h-4 w-4" />
                Team Stimmung
                {moodAlerts.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {moodAlerts.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateWeeklyMoodSurvey}
                disabled={isCreating}
                className="gap-2 bg-transparent"
              >
                <Zap className="h-4 w-4" />
                Wochentliche Stimmungsumfrage
              </Button>
            </div>
          </div>

          {showMoodDashboard && (
            <MoodDashboard
              isLoading={isLoadingMoodData}
              moodTrendData={moodTrendData}
              moodAlerts={moodAlerts}
              selectedPeriod={selectedMoodPeriod}
              onPeriodChange={setSelectedMoodPeriod}
              onCreateMoodSurvey={handleCreateWeeklyMoodSurvey}
              isCreating={isCreating}
            />
          )}

          {/* Survey List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSurveys.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "Keine Umfragen gefunden"
                    : activeTab === "all"
                      ? "Noch keine Umfragen erstellt"
                      : `Keine ${activeTab === "draft" ? "Entwurfe" : activeTab === "active" ? "aktiven" : activeTab === "closed" ? "beendeten" : "archivierten"} Umfragen`}
                </p>
                {!searchQuery && activeTab === "all" && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Erste Umfrage erstellen
                  </Button>
                )}
              </div>
            ) : (
              filteredSurveys.map((survey) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  onEdit={openEditDialog}
                    onDelete={(id) => {
                      const survey = surveys.find((s) => s.id === id)
                      if (survey) setDeleteTarget(survey)
                    }}
                  onDuplicate={handleDuplicateSurvey}
                  onCopyLink={copyPublicLink}
                  onToggleStatus={handleToggleStatus}
                  onShowResults={(s) => {
                    setSelectedSurvey(s)
                    setShowResultsDialog(true)
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateSurveyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        newSurvey={newSurvey}
        onNewSurveyChange={setNewSurvey}
        onSubmit={handleCreateSurvey}
        isCreating={isCreating}
      />
      <TemplateSelectionDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        templates={templates}
        onSelectTemplate={handleCreateFromTemplate}
        isCreating={isCreating}
      />
      <AIGenerationDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        aiPrompt={aiPrompt}
        onAIPromptChange={setAIPrompt}
        onGenerate={handleGenerateWithAI}
        isGenerating={isGeneratingAI}
      />
      <ResultsDialog open={showResultsDialog} onOpenChange={setShowResultsDialog} survey={selectedSurvey} />
      <EditSurveyDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        editData={editSurveyData}
        onEditDataChange={setEditSurveyData}
        onSubmit={handleEditSurvey}
        isCreating={isCreating}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Umfrage löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Umfrage <span className="font-semibold text-foreground">{deleteTarget?.title}</span> wirklich
              löschen? Alle zugehörigen Antworten und Ergebnisse werden ebenfalls entfernt. Diese Aktion kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  handleDeleteSurvey(deleteTarget.id)
                  setDeleteTarget(null)
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}

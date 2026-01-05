"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTranslation } from "@/contexts/translation-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { toast } from "sonner"
import { Sparkles, History, X, Trash2, RotateCcw, Check, Target, Eye, Circle, Loader2 } from "lucide-react"
import { formatDateDE } from "@/lib/date-utils"
import { AppLayout } from "@/components/app-layout"

const LEITBILD_CACHE_KEY = "effizienz-praxis-leitbild-cache"

interface LeitbildVersion {
  id: string
  practice_id: string
  mission_statement: string | null
  vision_statement: string | null
  leitbild_one_sentence: string | null
  questionnaire_responses: Record<string, string> | null
  version: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

interface QuestionnaireResponses {
  core_values: string
  unique_approach: string
  patient_focus: string
  future_vision: string
  impact: string
}

const defaultResponses: QuestionnaireResponses = {
  core_values: "",
  unique_approach: "",
  patient_focus: "",
  future_vision: "",
  impact: "",
}

const questions = [
  {
    id: "core_values",
    question: "Was sind die 3-5 wichtigsten Werte Ihrer Praxis?",
    placeholder: "z.B. Vertrauen, Qualität, Innovation, Menschlichkeit...",
  },
  {
    id: "patient_focus",
    question: "Wer sind Ihre idealen Patienten und was macht sie besonders?",
    placeholder: "Beschreiben Sie Ihre Zielgruppe und deren Bedürfnisse...",
  },
  {
    id: "unique_approach",
    question: "Was unterscheidet Ihre Praxis von anderen?",
    placeholder: "Beschreiben Sie Ihren besonderen Ansatz und Ihre Stärken...",
  },
  {
    id: "future_vision",
    question: "Wo sehen Sie Ihre Praxis in 5 Jahren?",
    placeholder: "Beschreiben Sie Ihre Ziele und Ihre Vision...",
  },
  {
    id: "impact",
    question: "Welchen Beitrag leistet Ihre Praxis für die Gemeinschaft?",
    placeholder: "z.B. Verbesserung der Gesundheitsversorgung, Aufklärung...",
  },
]

export default function LeitbildPageClient() {
  const { currentUser: user, loading: userLoading } = useUser()
  const { currentPractice, loading: practiceLoading } = usePractice()
  const { t } = useTranslation()

  const [versions, setVersions] = useState<LeitbildVersion[]>([])
  const [activeVersion, setActiveVersion] = useState<LeitbildVersion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const [showWizard, setShowWizard] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<QuestionnaireResponses>(defaultResponses)

  const [missionStatement, setMissionStatement] = useState("")
  const [visionStatement, setVisionStatement] = useState("")
  const [leitbildOneSentence, setLeitbildOneSentence] = useState("")

  const [isEditMode, setIsEditMode] = useState(false)
  const [editedMission, setEditedMission] = useState("")
  const [editedVision, setEditedVision] = useState("")
  const [editedOneSentence, setEditedOneSentence] = useState("")

  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [versionToDelete, setVersionToDelete] = useState<LeitbildVersion | null>(null)

  const fetchVersions = useCallback(async () => {
    if (!currentPractice?.id) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/leitbild/versions?practiceId=${currentPractice.id}`)

      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        const text = await response.text()
        if (text.includes("Too Many R") || response.status === 429) {
          toast.error("Zu viele Anfragen. Bitte warten Sie einen Moment.")
          return
        }
        throw new Error("Server returned non-JSON response")
      }

      if (!response.ok) throw new Error("Failed to fetch versions")

      const data = await response.json()
      setVersions(data.versions || [])

      const active = data.versions?.find((v: LeitbildVersion) => v.is_active)
      if (active) {
        setActiveVersion(active)
        setMissionStatement(active.mission_statement || "")
        setVisionStatement(active.vision_statement || "")
        setLeitbildOneSentence(active.leitbild_one_sentence || "")
        setResponses(active.questionnaire_responses || defaultResponses)
        setEditedMission(active.mission_statement || "")
        setEditedVision(active.vision_statement || "")
        setEditedOneSentence(active.leitbild_one_sentence || "")

        try {
          localStorage.setItem(
            LEITBILD_CACHE_KEY,
            JSON.stringify({
              leitbildOneSentence: active.leitbild_one_sentence || "",
              missionStatement: active.mission_statement || "",
              visionStatement: active.vision_statement || "",
              updatedAt: new Date().toISOString(),
            }),
          )
        } catch {
          // Ignore localStorage errors
        }
      }
    } catch (error) {
      toast.error(t("leitbild.fetchError", "Fehler beim Laden des Leitbilds"))
    } finally {
      setIsLoading(false)
    }
  }, [currentPractice?.id, t])

  useEffect(() => {
    if (currentPractice?.id) {
      fetchVersions()
    }
  }, [currentPractice?.id, fetchVersions])

  const handleStartWizard = () => {
    setResponses(defaultResponses)
    setCurrentStep(0)
    setShowWizard(true)
  }

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleResponseChange = (value: string) => {
    const questionId = questions[currentStep].id as keyof QuestionnaireResponses
    setResponses((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleGenerateWithAI = async () => {
    if (!currentPractice?.id) return

    const hasResponses = Object.values(responses).some((v) => v.trim() !== "")
    if (!hasResponses) {
      toast.error(t("leitbild.fillQuestions", "Bitte beantworten Sie mindestens eine Frage"))
      return
    }

    try {
      setIsGenerating(true)
      const response = await fetch("/api/leitbild/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId: currentPractice.id,
          practiceName: currentPractice.name,
          responses,
        }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        const text = await response.text()
        if (text.includes("Too Many R") || response.status === 429) {
          toast.error("Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.")
          return
        }
        throw new Error("Server returned non-JSON response")
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to generate")
      }

      const data = await response.json()
      setMissionStatement(data.mission || "")
      setVisionStatement(data.vision || "")
      setLeitbildOneSentence(data.leitbild || "")
      setEditedMission(data.mission || "")
      setEditedVision(data.vision || "")
      setEditedOneSentence(data.leitbild || "")

      setShowWizard(false)
      toast.success(t("leitbild.generated", "Leitbild wurde generiert"))
    } catch (error) {
      console.error("Error generating leitbild:", error)
      toast.error(t("leitbild.generateError", "Fehler beim Generieren des Leitbilds"))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!currentPractice?.id || !user?.id) return

    const finalMission = isEditMode ? editedMission : missionStatement
    const finalVision = isEditMode ? editedVision : visionStatement
    const finalOneSentence = isEditMode ? editedOneSentence : leitbildOneSentence

    if (!finalMission.trim() && !finalVision.trim() && !finalOneSentence.trim()) {
      toast.error(t("leitbild.fillAtLeastOne", "Bitte füllen Sie mindestens ein Feld aus"))
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch("/api/leitbild/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId: currentPractice.id,
          responses,
          missionStatement: finalMission,
          visionStatement: finalVision,
          leitbildOneSentence: finalOneSentence,
          existingVersion: activeVersion?.version,
        }),
      })

      if (!response.ok) throw new Error("Failed to save")

      try {
        localStorage.setItem(
          LEITBILD_CACHE_KEY,
          JSON.stringify({
            leitbildOneSentence: finalOneSentence,
            missionStatement: finalMission,
            visionStatement: finalVision,
            updatedAt: new Date().toISOString(),
          }),
        )
      } catch {
        // Ignore localStorage errors
      }

      toast.success(t("leitbild.saved", "Leitbild wurde gespeichert"))
      setIsEditMode(false)
      await fetchVersions()
    } catch (error) {
      console.error("Error saving leitbild:", error)
      toast.error(t("leitbild.saveError", "Fehler beim Speichern des Leitbilds"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleActivateVersion = async (versionId: string) => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/leitbild/${versionId}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceId: currentPractice.id }),
      })

      if (!response.ok) throw new Error("Failed to activate")

      toast.success(t("leitbild.versionActivated", "Version aktiviert"))
      await fetchVersions()
      setIsHistoryDialogOpen(false)
    } catch (error) {
      console.error("Error activating version:", error)
      toast.error(t("leitbild.activateError", "Fehler beim Aktivieren der Version"))
    }
  }

  const handleDeleteVersion = async () => {
    if (!versionToDelete || !currentPractice?.id) return

    try {
      const response = await fetch(`/api/leitbild/versions/${versionToDelete.id}?practiceId=${currentPractice.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete")

      setVersions((prev) => prev.filter((v) => v.id !== versionToDelete.id))
      toast.success(t("leitbild.versionDeleted", "Version gelöscht"))
      setIsDeleteDialogOpen(false)
      setVersionToDelete(null)
    } catch (error) {
      console.error("Error deleting version:", error)
      toast.error(t("leitbild.deleteError", "Fehler beim Löschen der Version"))
    }
  }

  const handleRestoreVersion = (version: LeitbildVersion) => {
    setMissionStatement(version.mission_statement || "")
    setVisionStatement(version.vision_statement || "")
    setLeitbildOneSentence(version.leitbild_one_sentence || "")
    setEditedMission(version.mission_statement || "")
    setEditedVision(version.vision_statement || "")
    setEditedOneSentence(version.leitbild_one_sentence || "")
    setResponses(version.questionnaire_responses || defaultResponses)
    setIsHistoryDialogOpen(false)
    setIsEditMode(true)
    toast.success(t("leitbild.versionRestored", "Version wiederhergestellt - bitte speichern"))
  }

  const handleEnterEditMode = () => {
    if (activeVersion) {
      setEditedMission(activeVersion.mission_statement || "")
      setEditedVision(activeVersion.vision_statement || "")
      setEditedOneSentence(activeVersion.leitbild_one_sentence || "")
    }
    setIsEditMode(true)
  }

  const handleCancelEdit = () => {
    if (activeVersion) {
      setEditedMission(activeVersion.mission_statement || "")
      setEditedVision(activeVersion.vision_statement || "")
      setEditedOneSentence(activeVersion.leitbild_one_sentence || "")
    }
    setIsEditMode(false)
  }

  if (userLoading || practiceLoading || isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!user || !currentPractice) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full p-6">
          <p className="text-muted-foreground">Bitte melden Sie sich an</p>
        </div>
      </AppLayout>
    )
  }

  if (showWizard) {
    const progressPercent = ((currentStep + 1) / questions.length) * 100
    const currentQuestion = questions[currentStep]
    const currentResponseValue = responses[currentQuestion.id as keyof QuestionnaireResponses]
    const isLastStep = currentStep === questions.length - 1

    return (
      <AppLayout>
        <div className="min-h-screen bg-muted/30">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Header Badge */}
            <div className="flex justify-center mb-6">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-0">
                <Sparkles className="mr-2 h-4 w-4" />
                KI-gestütztes Leitbild
              </Badge>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-3">Leitbild erstellen</h1>
              <p className="text-muted-foreground text-lg">
                Beantworten Sie einige Fragen zu Ihrer Praxis. Unsere KI hilft Ihnen dann, ein professionelles Leitbild
                zu erstellen.
              </p>
            </div>

            {/* Progress indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Frage {currentStep + 1} von {questions.length}
                </span>
                <span className="text-sm font-medium text-primary">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Question Card */}
            <Card className="mb-6 shadow-sm">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold mb-6">{currentQuestion.question}</h2>
                <Textarea
                  value={currentResponseValue}
                  onChange={(e) => handleResponseChange(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  rows={4}
                  className="resize-none text-base"
                />
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between mb-8">
              <Button
                variant="outline"
                onClick={currentStep === 0 ? () => setShowWizard(false) : handleBack}
                className="px-6"
              >
                Zurück
              </Button>

              {isLastStep ? (
                <Button onClick={handleGenerateWithAI} disabled={isGenerating} className="px-6 bg-primary">
                  {isGenerating ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                      Generiere...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Leitbild generieren
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} className="px-6 bg-primary">
                  Weiter
                </Button>
              )}
            </div>

            {/* Progress Overview */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Fortschritt</h3>
                <div className="space-y-3">
                  {questions.map((q, index) => {
                    const responseValue = responses[q.id as keyof QuestionnaireResponses]
                    const isAnswered = responseValue && responseValue.trim() !== ""
                    const isCurrent = index === currentStep

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentStep(index)}
                        className={`flex items-center gap-3 w-full text-left p-2 rounded-lg transition-colors ${
                          isCurrent ? "bg-primary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        {isAnswered ? (
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span
                          className={`text-sm ${isCurrent ? "font-medium text-foreground" : "text-muted-foreground"}`}
                        >
                          {q.question}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("leitbild.title", "Leitbild")}</h1>
            <p className="text-muted-foreground">
              {t("leitbild.subtitle", "Definieren Sie die Mission und Vision Ihrer Praxis")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(true)}>
              <History className="mr-2 h-4 w-4" />
              {t("leitbild.viewHistory", "Historie")}
            </Button>
            <Button onClick={handleStartWizard} className="bg-primary">
              <Sparkles className="mr-2 h-4 w-4" />
              {t("leitbild.generateNew", "Mit KI erstellen")}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        {activeVersion ? (
          <div className="space-y-6">
            {/* Leitbild Card - Light blue/indigo background */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-blue-50/50 dark:from-primary/20 dark:via-primary/10 dark:to-blue-950/20">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">{t("leitbild.leitbild", "Leitbild")}</h2>
                </div>
                {isEditMode ? (
                  <Textarea
                    value={editedOneSentence}
                    onChange={(e) => setEditedOneSentence(e.target.value)}
                    rows={3}
                    className="bg-background border-border resize-none text-base"
                    placeholder="Ihr Leitbild in einem Satz..."
                  />
                ) : (
                  <div className="bg-background rounded-lg border border-border p-4">
                    <p className="text-base leading-relaxed">
                      {activeVersion.leitbild_one_sentence || "Kein Leitbild definiert"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mission Statement Card - White background */}
            <Card className="border-border bg-card">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">{t("leitbild.mission", "Mission Statement")}</h2>
                </div>
                {isEditMode ? (
                  <Textarea
                    value={editedMission}
                    onChange={(e) => setEditedMission(e.target.value)}
                    rows={6}
                    className="bg-background border-border resize-none text-base"
                    placeholder="Beschreiben Sie Ihre Mission..."
                  />
                ) : (
                  <div className="bg-background rounded-lg border border-border p-4">
                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                      {activeVersion.mission_statement || "Keine Mission definiert"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vision Statement Card - White background */}
            <Card className="border-border bg-card">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Eye className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">{t("leitbild.vision", "Vision Statement")}</h2>
                </div>
                {isEditMode ? (
                  <Textarea
                    value={editedVision}
                    onChange={(e) => setEditedVision(e.target.value)}
                    rows={6}
                    className="bg-background border-border resize-none text-base"
                    placeholder="Beschreiben Sie Ihre Vision..."
                  />
                ) : (
                  <div className="bg-background rounded-lg border border-border p-4">
                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                      {activeVersion.vision_statement || "Keine Vision definiert"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowWizard(true)
                  setCurrentStep(0)
                }}
                className="px-6"
              >
                Neu generieren
              </Button>

              <Button onClick={handleSave} disabled={isSaving} className="px-6 bg-primary">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  "Leitbild speichern"
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Empty State */
          <Card className="border-dashed border-2">
            <CardContent className="flex h-96 flex-col items-center justify-center text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <X className="h-12 w-12 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t("leitbild.noVersion", "Noch kein Leitbild vorhanden")}</h3>
              <p className="mb-6 text-muted-foreground max-w-md">
                {t(
                  "leitbild.createFirst",
                  "Erstellen Sie Ihr Praxis-Leitbild mit KI-Unterstützung. Beantworten Sie einige Fragen und erhalten Sie ein professionelles Leitbild.",
                )}
              </p>
              <Button onClick={handleStartWizard} size="lg">
                <Sparkles className="mr-2 h-5 w-5" />
                {t("leitbild.generateNew", "Leitbild mit KI erstellen")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("leitbild.versionHistory", "Versionsverlauf")}</DialogTitle>
            <DialogDescription>
              {t("leitbild.versionHistoryDesc", "Alle gespeicherten Versionen Ihres Leitbilds")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {versions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t("leitbild.noVersions", "Keine Versionen vorhanden")}
              </p>
            ) : (
              versions.map((version) => (
                <Card key={version.id} className={version.is_active ? "border-green-500" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">Version {version.version}</CardTitle>
                        {version.is_active && (
                          <Badge variant="default" className="bg-green-500">
                            <Check className="mr-1 h-3 w-3" />
                            {t("leitbild.active", "Aktiv")}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{formatDateDE(version.created_at)}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {version.leitbild_one_sentence && (
                      <p className="text-sm font-medium">&quot;{version.leitbild_one_sentence}&quot;</p>
                    )}
                    <div className="flex gap-2">
                      {!version.is_active && (
                        <Button variant="outline" size="sm" onClick={() => handleActivateVersion(version.id)}>
                          <Check className="mr-1 h-3 w-3" />
                          {t("leitbild.activate", "Aktivieren")}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleRestoreVersion(version)}>
                        <RotateCcw className="mr-1 h-3 w-3" />
                        {t("leitbild.restore", "Wiederherstellen")}
                      </Button>
                      {!version.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 bg-transparent"
                          onClick={() => {
                            setVersionToDelete(version)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          {t("common.delete", "Löschen")}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              {t("common.close", "Schließen")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("leitbild.deleteVersion", "Version löschen?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "leitbild.deleteVersionDesc",
                "Diese Aktion kann nicht rückgängig gemacht werden. Die Version wird permanent gelöscht.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Abbrechen")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVersion} className="bg-red-600 hover:bg-red-700">
              {t("common.delete", "Löschen")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}

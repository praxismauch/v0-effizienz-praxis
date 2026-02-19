"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTranslation } from "@/contexts/translation-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Sparkles, History, X } from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { PageHeader } from "@/components/page-layout"
import { WizardView } from "./wizard-view"
import { LeitbildDisplay } from "./leitbild-display"
import { VersionHistoryDialog, DeleteVersionDialog } from "./version-history-dialog"
import {
  LEITBILD_CACHE_KEY,
  defaultResponses,
  questions,
  type LeitbildVersion,
  type QuestionnaireResponses,
} from "./types"

export default function LeitbildPageClient() {
  const { currentUser: user, loading: userLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
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

  const cacheToLocalStorage = useCallback((oneSentence: string, mission: string, vision: string) => {
    try {
      localStorage.setItem(LEITBILD_CACHE_KEY, JSON.stringify({
        leitbildOneSentence: oneSentence,
        missionStatement: mission,
        visionStatement: vision,
        updatedAt: new Date().toISOString(),
      }))
    } catch { /* ignore */ }
  }, [])

  const applyVersion = useCallback((v: LeitbildVersion) => {
    setActiveVersion(v)
    setMissionStatement(v.mission_statement || "")
    setVisionStatement(v.vision_statement || "")
    setLeitbildOneSentence(v.leitbild_one_sentence || "")
    setEditedMission(v.mission_statement || "")
    setEditedVision(v.vision_statement || "")
    setEditedOneSentence(v.leitbild_one_sentence || "")
    setResponses(v.questionnaire_responses as QuestionnaireResponses || defaultResponses)
    cacheToLocalStorage(v.leitbild_one_sentence || "", v.mission_statement || "", v.vision_statement || "")
  }, [cacheToLocalStorage])

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
      if (active) applyVersion(active)
    } catch {
      toast.error(t("leitbild.fetchError", "Fehler beim Laden des Leitbilds"))
    } finally {
      setIsLoading(false)
    }
  }, [currentPractice?.id, t, applyVersion])

  useEffect(() => {
    if (currentPractice?.id) fetchVersions()
  }, [currentPractice?.id, fetchVersions])

  const handleStartWizard = () => {
    setResponses(defaultResponses)
    setCurrentStep(0)
    setShowWizard(true)
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
        body: JSON.stringify({ practiceId: currentPractice.id, practiceName: currentPractice.name, responses }),
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
      cacheToLocalStorage(finalOneSentence, finalMission, finalVision)
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
      const response = await fetch(`/api/leitbild/versions/${versionToDelete.id}?practiceId=${currentPractice.id}`, { method: "DELETE" })
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
    applyVersion(version)
    setIsHistoryDialogOpen(false)
    setIsEditMode(true)
    toast.success(t("leitbild.versionRestored", "Version wiederhergestellt - bitte speichern"))
  }

  // Loading state
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

  // Wizard view
  if (showWizard) {
    return (
      <AppLayout>
        <WizardView
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          responses={responses}
          onResponseChange={handleResponseChange}
          onBack={() => setCurrentStep((s) => Math.max(0, s - 1))}
          onNext={() => setCurrentStep((s) => Math.min(questions.length - 1, s + 1))}
          onGenerate={handleGenerateWithAI}
          onClose={() => setShowWizard(false)}
          isGenerating={isGenerating}
        />
      </AppLayout>
    )
  }

  // Main view
  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <PageHeader
          title={t("leitbild.title", "Leitbild")}
          subtitle={t("leitbild.subtitle", "Definieren Sie die Mission und Vision Ihrer Praxis")}
          actions={
            <>
              <Button variant="outline" onClick={() => setIsHistoryDialogOpen(true)}>
                <History className="mr-2 h-4 w-4" />
                {t("leitbild.viewHistory", "Historie")}
              </Button>
              <Button onClick={handleStartWizard} className="bg-primary">
                <Sparkles className="mr-2 h-4 w-4" />
                {t("leitbild.generateNew", "Mit KI erstellen")}
              </Button>
            </>
          }
        />

        {/* Content */}
        {activeVersion ? (
          <LeitbildDisplay
            activeVersion={activeVersion}
            isEditMode={isEditMode}
            editedOneSentence={editedOneSentence}
            editedMission={editedMission}
            editedVision={editedVision}
            setEditedOneSentence={setEditedOneSentence}
            setEditedMission={setEditedMission}
            setEditedVision={setEditedVision}
            onSave={handleSave}
            onRegenerate={() => { setShowWizard(true); setCurrentStep(0) }}
            isSaving={isSaving}
            t={t}
          />
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="flex h-96 flex-col items-center justify-center text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <X className="h-12 w-12 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t("leitbild.noVersion", "Noch kein Leitbild vorhanden")}</h3>
              <p className="mb-6 text-muted-foreground max-w-md">
                {t("leitbild.createFirst", "Erstellen Sie Ihr Praxis-Leitbild mit KI-Unterstutzung.")}
              </p>
              <Button onClick={handleStartWizard} size="lg">
                <Sparkles className="mr-2 h-5 w-5" />
                {t("leitbild.generateNew", "Leitbild mit KI erstellen")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <VersionHistoryDialog
        isOpen={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
        versions={versions}
        onActivate={handleActivateVersion}
        onRestore={handleRestoreVersion}
        onDelete={(version) => { setVersionToDelete(version); setIsDeleteDialogOpen(true) }}
        t={t}
      />
      <DeleteVersionDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteVersion}
        t={t}
      />
    </AppLayout>
  )
}

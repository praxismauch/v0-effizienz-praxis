"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import useSWR from "swr"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTranslation } from "@/contexts/translation-context"
import { Loader2 } from "lucide-react"
import { useTeam } from "@/contexts/team-context"
import { useToast } from "@/hooks/use-toast"
import { SWR_KEYS } from "@/lib/swr-keys"
import { swrFetcher } from "@/lib/swr-fetcher"
import { GoalFormFields } from "@/components/goals/goal-form-fields"
import { GoalTeamAssignment } from "@/components/goals/goal-team-assignment"
import { GoalExtendedSettings } from "@/components/goals/goal-extended-settings"

interface CreateGoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGoalCreated: () => void
  parentGoalId?: string
  initialData?: any
  linkedParameterId?: string
}

interface Team {
  id: string
  name: string
  color?: string
  memberCount?: number
  isActive?: boolean
}

export function CreateGoalDialog({
  open,
  onOpenChange,
  onGoalCreated,
  parentGoalId,
  initialData,
  linkedParameterId,
}: CreateGoalDialogProps) {
  const { currentUser, loading: userLoading } = useUser()
  const { currentPractice } = usePractice()
  const { t } = useTranslation()
  const { teamMembers: contextTeamMembers, loading: teamLoading } = useTeam()
  const { toast } = useToast()

  const getEffectivePracticeId = () => {
    return currentPractice?.id && currentPractice.id !== "0" && currentPractice.id !== "undefined"
      ? currentPractice.id
      : "1"
  }

  const effectivePracticeId = getEffectivePracticeId()

  const { data: goalsData } = useSWR(
    open && effectivePracticeId && !parentGoalId
      ? `${SWR_KEYS.goals(effectivePracticeId)}?includeSubgoals=false`
      : null,
    swrFetcher,
  )

  const { data: parametersData } = useSWR(
    open && effectivePracticeId ? SWR_KEYS.parameters(effectivePracticeId) : null,
    swrFetcher,
  )

  const { data: categoriesData, isLoading: loadingCategories } = useSWR(
    open && effectivePracticeId ? SWR_KEYS.orgaCategories(effectivePracticeId) : null,
    swrFetcher,
  )

  const { data: teamsData, isLoading: loadingTeams } = useSWR(
    open && effectivePracticeId ? SWR_KEYS.teams(effectivePracticeId) : null,
    swrFetcher,
  )

  const availableGoals = goalsData?.goals || []
  const availableParameters = parametersData?.parameters || []
  const rawTeams = Array.isArray(teamsData) ? teamsData : []
  const teams: Team[] = rawTeams.filter((t: Team) => t.isActive !== false)

  const orgaCategories = (() => {
    const categories = categoriesData?.categories || []
    const seen = new Set<string>()
    return categories.filter((cat: any) => {
      const key = cat.name?.toLowerCase()?.trim()
      if (key && !seen.has(key)) {
        seen.add(key)
        return true
      }
      return false
    })
  })()

  const [createAsSubgoal, setCreateAsSubgoal] = useState(!!parentGoalId)
  const [showExtended, setShowExtended] = useState(false)
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; fileName: string; fileSize: number }>>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const teamMembers = contextTeamMembers || []
  const isTeamLoading = teamLoading

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    goalType: "personal" as "practice" | "personal" | "team",
    currentValue: "",
    targetValue: "",
    unit: "",
    progressPercentage: "0",
    priority: "medium" as "low" | "medium" | "high",
    status: "not-started" as "not-started" | "in-progress" | "completed" | "cancelled",
    startDate: "",
    endDate: "",
    isPrivate: true,
    parentGoalId: parentGoalId || "",
    linkedParameterId: linkedParameterId || "",
    category: "",
  })

  const calculatedProgress = (() => {
    const current = Number.parseFloat(formData.currentValue)
    const target = Number.parseFloat(formData.targetValue)

    if (isNaN(current) || isNaN(target) || target === 0) {
      return null
    }

    const percentage = Math.round((current / target) * 100)
    return Math.min(100, Math.max(0, percentage))
  })()

  useEffect(() => {
    if (initialData && open) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        goalType: initialData.goalType || "practice",
        currentValue: "",
        targetValue: initialData.targetValue?.toString() || "",
        unit: initialData.unit || "",
        progressPercentage: "0",
        priority: initialData.priority || "medium",
        status: "not-started",
        startDate: initialData.startDate || "",
        endDate: initialData.suggestedEndDate || "",
        isPrivate: true,
        parentGoalId: parentGoalId || "",
        linkedParameterId: linkedParameterId || "",
        category: initialData.category || "",
      })
    }
  }, [initialData, open, parentGoalId, linkedParameterId])

  const fetchLatestParameterValue = async (parameterId: string) => {
    if (!parameterId || parameterId === "none") {
      return
    }

    try {
      const response = await fetch(
        `/api/practices/${effectivePracticeId}/parameter-values?parameterId=${parameterId}&limit=1`,
        { credentials: "include" },
      )
      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          const latestValue = data[0].value
          setFormData((prev) => ({
            ...prev,
            currentValue: latestValue.toString(),
          }))
        }
      }
    } catch (error) {
      console.error("Error fetching latest parameter value:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (userLoading) {
      toast({
        title: "Bitte warten",
        description: "Benutzerdaten werden geladen...",
      })
      return
    }

    if (!currentUser || !effectivePracticeId) {
      toast({
        title: "Fehler",
        description: "Benutzer oder Praxis nicht gefunden. Bitte laden Sie die Seite neu.",
        variant: "destructive",
      })
      return
    }

    if (createAsSubgoal && !formData.parentGoalId && !parentGoalId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie ein übergeordnetes Ziel aus.",
        variant: "destructive",
      })
      return
    }

    if (formData.targetValue && !formData.unit) {
      toast({
        title: "Einheit fehlt",
        description: "Bitte geben Sie eine Einheit für den Zielwert an (z.B. Stunden, %, kg).",
        variant: "destructive",
      })
      return
    }

    if (formData.unit && !formData.targetValue) {
      toast({
        title: "Zielwert fehlt",
        description: "Bitte geben Sie einen Zielwert an.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const finalProgress =
        calculatedProgress !== null ? calculatedProgress : Number.parseInt(formData.progressPercentage, 10)

      const finalParentGoalId = formData.parentGoalId || parentGoalId || null
      const finalLinkedParameterId = formData.linkedParameterId || null

      const goalData: any = {
        title: formData.title,
        description: formData.description || null,
        goal_type: formData.goalType as "personal" | "team" | "department" | "practice",
        current_value: formData.currentValue ? Number.parseFloat(formData.currentValue) : null,
        target_value: formData.targetValue ? Number.parseFloat(formData.targetValue) : null,
        unit: formData.unit || null,
        progress_percentage: finalProgress,
        priority: formData.priority as "low" | "medium" | "high",
        status: formData.status as "not-started" | "in-progress" | "completed" | "cancelled",
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        is_private: formData.isPrivate,
        parent_goal_id: finalParentGoalId,
        linked_parameter_id: finalLinkedParameterId,
        category: formData.category || null,
        practice_id: effectivePracticeId,
        created_by: currentUser.id,
        teams: selectedTeams,
      }

      const response = await fetch(`/api/practices/${effectivePracticeId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(goalData),
      })

      if (!response.ok) throw new Error("Failed to create goal")

      const responseData = await response.json()
      const newGoal = responseData.goal || responseData

      if (uploadedImages.length > 0) {
        await Promise.all(
          uploadedImages.map((image) =>
            fetch(`/api/practices/${effectivePracticeId}/goals/${newGoal.id}/attachments`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                attachment_type: "image",
                file_url: image.url,
                file_name: image.fileName,
                file_size: image.fileSize,
                file_type: "image",
              }),
            }),
          ),
        )
      }

      if (selectedTeamMembers.length > 0 && newGoal?.id) {
        const assignmentResponse = await fetch(
          `/api/practices/${effectivePracticeId}/goals/${newGoal.id}/assignments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              teamMemberIds: selectedTeamMembers,
              assignedBy: currentUser.id,
            }),
          },
        )

        if (!assignmentResponse.ok) {
          const errorData = await assignmentResponse.json()
          toast({
            title: "Ziel erstellt",
            description:
              errorData.message || "Ziel wurde erstellt, aber einige Teammitglieder konnten nicht zugewiesen werden.",
            variant: "default",
          })
        }
      }

      onGoalCreated()
      onOpenChange(false)
      setFormData({
        title: "",
        description: "",
        goalType: "personal",
        currentValue: "",
        targetValue: "",
        unit: "",
        progressPercentage: "0",
        priority: "medium",
        status: "not-started",
        startDate: "",
        endDate: "",
        isPrivate: true,
        parentGoalId: parentGoalId || "",
        linkedParameterId: "",
        category: "",
      })
      setSelectedTeamMembers([])
      setUploadedImages([])
      setSelectedTeams([])
    } catch (error) {
      console.error("Error creating goal:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Erstellen des Ziels",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items || !currentPractice) {
        if (!currentPractice) {
          toast({
            title: "Fehler",
            description: "Keine Praxis-ID gefunden. Bitte laden Sie die Seite neu.",
            variant: "destructive",
          })
        }
        return
      }

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            await uploadImage(file)
          }
        }
      }
    },
    [currentPractice],
  )

  const uploadImage = async (file: File) => {
    if (!currentPractice) {
      toast({
        title: "Fehler",
        description: "Keine Praxis-ID gefunden. Bild kann nicht hochgeladen werden.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const { compressImageIfLarge } = await import("@/lib/image-compression")
      const compressedFile = await compressImageIfLarge(file)
      const formDataUpload = new FormData()
      formDataUpload.append("file", compressedFile)

      const response = await fetch(`/api/upload`, {
        method: "POST",
        body: formDataUpload,
      })

      if (response.ok) {
        const data = await response.json()
        setUploadedImages((prev) => [...prev, { url: data.url, fileName: file.name, fileSize: file.size }])
        toast({
          title: "Erfolg",
          description: "Bild erfolgreich hochgeladen.",
        })
      } else {
        toast({
          title: "Fehler",
          description: "Bild konnte nicht hochgeladen werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Hochladen des Bildes.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      for (const file of files) {
        if (file.type.startsWith("image/")) {
          await uploadImage(file)
        }
      }
    },
    [currentPractice],
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl" onPaste={handlePaste}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("goals.create.title", "Neues Ziel erstellen")}</DialogTitle>
            <DialogDescription>{t("goals.create.description", "Erstellen Sie ein neues Ziel")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <GoalFormFields
              formData={formData}
              setFormData={setFormData}
              calculatedProgress={calculatedProgress}
              orgaCategories={orgaCategories}
            />

            <GoalTeamAssignment
              teams={teams}
              teamMembers={teamMembers}
              selectedTeams={selectedTeams}
              setSelectedTeams={setSelectedTeams}
              selectedTeamMembers={selectedTeamMembers}
              setSelectedTeamMembers={setSelectedTeamMembers}
              loadingTeams={loadingTeams}
              isTeamLoading={isTeamLoading}
            />

            <GoalExtendedSettings
              showExtended={showExtended}
              setShowExtended={setShowExtended}
              formData={formData}
              setFormData={setFormData}
              createAsSubgoal={createAsSubgoal}
              setCreateAsSubgoal={setCreateAsSubgoal}
              parentGoalId={parentGoalId}
              availableGoals={availableGoals}
              availableParameters={availableParameters}
              fetchLatestParameterValue={fetchLatestParameterValue}
              uploadedImages={uploadedImages}
              isUploading={isUploading}
              handleDrop={handleDrop}
              handleDragOver={handleDragOver}
              removeImage={removeImage}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("common.creating", "Wird erstellt...")}
                </>
              ) : (
                t("common.create", "Erstellen")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateGoalDialog

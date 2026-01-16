"use client"

import type React from "react"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTranslation } from "@/contexts/translation-context"
import { Link, ChevronDown, ChevronUp, X, Upload, type File, FileText, Users, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useTeam } from "@/contexts/team-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { isActiveMember } from "@/lib/utils/team-member-filter"

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

  const getEffectivePracticeId = () => {
    return currentPractice?.id && currentPractice.id !== "0" && currentPractice.id !== "undefined"
      ? currentPractice.id
      : "1"
  }

  const [loading, setLoading] = useState(false)
  const [availableGoals, setAvailableGoals] = useState<any[]>([])
  const [availableParameters, setAvailableParameters] = useState<any[]>([])
  const [createAsSubgoal, setCreateAsSubgoal] = useState(!!parentGoalId)
  const [showExtended, setShowExtended] = useState(false)
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; fileName: string; fileSize: number }>>([])
  const [isUploading, setIsUploading] = useState(false)
  const [orgaCategories, setOrgaCategories] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localTeamMembers, setLocalTeamMembers] = useState<any[]>([])
  const [loadingLocalTeam, setLoadingLocalTeam] = useState(false)
  const { toast } = useToast()

  const teamMembers = contextTeamMembers?.length > 0 ? contextTeamMembers : localTeamMembers
  const isTeamLoading = teamLoading || loadingLocalTeam

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
    startDate: "", // Added startDate field to form form
    endDate: "",
    isPrivate: true,
    parentGoalId: parentGoalId || "",
    linkedParameterId: linkedParameterId || "",
    category: "", // New category state
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

  const displayProgress =
    calculatedProgress !== null ? calculatedProgress : Number.parseInt(formData.progressPercentage, 10)

  useEffect(() => {
    const effectivePracticeId = getEffectivePracticeId()
    if (open && effectivePracticeId && !parentGoalId) {
      fetchAvailableGoals()
    }
    if (open && effectivePracticeId) {
      fetchAvailableParameters()
    }
  }, [open, currentPractice?.id, parentGoalId])

  useEffect(() => {
    console.log("[v0] Dialog rendering, isOpen:", open)
    console.log("[v0] Available parameters:", availableParameters.length)
    console.log("[v0] Show extended", showExtended)
  }, [open, availableParameters, showExtended])

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
        startDate: initialData.startDate || "", // Initialize startDate from initialData
        endDate: initialData.suggestedEndDate || "",
        isPrivate: true,
        parentGoalId: parentGoalId || "",
        linkedParameterId: linkedParameterId || "",
        category: initialData.category || "", // Initialize category from initialData
      })
    }
  }, [initialData, open, parentGoalId, linkedParameterId])

  const fetchAvailableGoals = async () => {
    try {
      const effectivePracticeId = getEffectivePracticeId()
      const response = await fetch(`/api/practices/${effectivePracticeId}/goals?includeSubgoals=false`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setAvailableGoals(data.goals || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching available goals:", error)
    }
  }

  const fetchAvailableParameters = async () => {
    try {
      const effectivePracticeId = getEffectivePracticeId()
      const response = await fetch(`/api/practices/${effectivePracticeId}/parameters`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setAvailableParameters(data.parameters || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching available parameters:", error)
    }
  }

  const fetchLatestParameterValue = async (parameterId: string) => {
    if (!parameterId || parameterId === "none") {
      return
    }

    try {
      const effectivePracticeId = getEffectivePracticeId()
      const response = await fetch(
        `/api/practices/${effectivePracticeId}/parameter-values?parameterId=${parameterId}&limit=1`,
        {
          credentials: "include",
        },
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
      console.error("[v0] Error fetching latest parameter value:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] handleSubmit called")
    console.log("[v0] User:", currentUser)
    console.log("[v0] User loading:", userLoading)
    console.log("[v0] Current practice:", currentPractice)
    console.log("[v0] Form data:", formData)

    if (userLoading) {
      toast({
        title: "Bitte warten",
        description: "Benutzerdaten werden geladen...",
      })
      return
    }

    const effectivePracticeId = getEffectivePracticeId()
    if (!currentUser || !effectivePracticeId) {
      console.error("[v0] Missing user or practice:", { user: !!currentUser, practice: !!effectivePracticeId })
      toast({
        title: "Fehler",
        description: "Benutzer oder Praxis nicht gefunden. Bitte laden Sie die Seite neu.",
        variant: "destructive",
      })
      return
    }

    if (createAsSubgoal && !formData.parentGoalId && !parentGoalId) {
      console.error("[v0] Cannot create subgoal without parent goal")
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie ein übergeordnetes Ziel aus.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    console.log("[v0] Starting goal creation...")
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

      console.log("[v0] Goal data being sent:", {
        ...goalData,
        isSubgoal: !!finalParentGoalId,
        parentId: finalParentGoalId,
      })

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
        console.log("[v0] ========== ASSIGNING TEAM MEMBERS ==========")
        console.log("[v0] Goal ID:", newGoal.id)
        console.log("[v0] Practice ID:", effectivePracticeId)
        console.log("[v0] Selected team member IDs:", selectedTeamMembers)
        console.log("[v0] Assigned by (current user user):", currentUser.id)
        console.log(
          "[v0] Available team members from context:",
          teamMembers.map((m) => ({ id: m.id, name: m.name })),
        )

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
          console.error("[v0] ========== ASSIGNMENT FAILED ==========")
          console.error("[v0] Status:", assignmentResponse.status)
          console.error("[v0] Error data:", errorData)
          toast({
            title: "Ziel erstellt",
            description:
              errorData.message || "Ziel wurde erstellt, aber einige Teammitglieder konnten nicht zugewiesen werden.",
            variant: "default",
          })
        } else {
          const successData = await assignmentResponse.json()
          console.log("[v0] ========== ASSIGNMENT SUCCESS ==========")
          console.log("[v0] Success data:", successData)
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
        startDate: "", // Reset startDate on form reset
        endDate: "",
        isPrivate: true,
        parentGoalId: parentGoalId || "",
        linkedParameterId: "",
        category: "", // Reset category
      })
      setSelectedTeamMembers([])
      setUploadedImages([])
      setSelectedTeams([])
    } catch (error) {
      console.error("[v0] Error creating goal:", error)
      alert("Fehler beim Erstellen des Ziels")
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
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/upload`, {
        method: "POST",
        body: formData,
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
      console.error("[v0] Error uploading image:", error)
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

  useEffect(() => {
    const fetchLocalTeamMembers = async () => {
      const effectivePracticeId = getEffectivePracticeId()
      if (!open || !effectivePracticeId) {
        if (open && !effectivePracticeId) {
          toast({
            title: "Fehler",
            description: "Keine Praxis-ID gefunden. Team-Mitglieder können nicht geladen werden.",
            variant: "destructive",
          })
        }
        return
      }
      if (contextTeamMembers && contextTeamMembers.length > 0) return

      setLoadingLocalTeam(true)
      try {
        const response = await fetch(`/api/practices/${effectivePracticeId}/team-members`, {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          const members = Array.isArray(data) ? data : data.members || []
          setLocalTeamMembers(members.filter((m: any) => m.id && m.id.trim() !== ""))
        } else {
          toast({
            title: "Fehler",
            description: "Team-Mitglieder konnten nicht geladen werden.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("[v0] Error fetching local team members:", error)
        toast({
          title: "Fehler",
          description: "Fehler beim Laden der Team-Mitglieder.",
          variant: "destructive",
        })
      } finally {
        setLoadingLocalTeam(false)
      }
    }

    fetchLocalTeamMembers()
  }, [open, currentPractice?.id, contextTeamMembers])

  useEffect(() => {
    const fetchOrgaCategories = async () => {
      const effectivePracticeId = getEffectivePracticeId()
      if (!effectivePracticeId) {
        if (open) {
          toast({
            title: "Fehler",
            description: "Keine Praxis-ID gefunden. Kategorien können nicht geladen werden.",
            variant: "destructive",
          })
        }
        return
      }

      try {
        setLoadingCategories(true)
        const response = await fetch(`/api/practices/${effectivePracticeId}/orga-categories`)
        if (response.ok) {
          const data = await response.json()
          const categories = data.categories || []
          const seen = new Set<string>()
          const uniqueCategories = categories.filter((cat: any) => {
            const key = cat.name?.toLowerCase()?.trim()
            if (key && !seen.has(key)) {
              seen.add(key)
              return true
            }
            return false
          })
          setOrgaCategories(uniqueCategories)
        } else {
          toast({
            title: "Fehler",
            description: "Kategorien konnten nicht geladen werden.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("[v0] Error fetching orga categories:", error)
        toast({
          title: "Fehler",
          description: "Fehler beim Laden der Kategorien.",
          variant: "destructive",
        })
      } finally {
        setLoadingCategories(false)
      }
    }

    if (open) {
      fetchOrgaCategories()
    }
  }, [open, currentPractice?.id])

  useEffect(() => {
    const fetchTeams = async () => {
      const effectivePracticeId = getEffectivePracticeId()
      if (!open || !effectivePracticeId) return

      setLoadingTeams(true)
      try {
        const response = await fetch(`/api/practices/${effectivePracticeId}/teams`)
        if (response.ok) {
          const data = await response.json()
          setTeams(Array.isArray(data) ? data.filter((t: Team) => t.isActive !== false) : [])
        }
      } catch (error) {
        console.error("[v0] Error fetching teams:", error)
      } finally {
        setLoadingTeams(false)
      }
    }

    fetchTeams()
  }, [open, currentPractice?.id])

  const toggleTeam = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(selectedTeams.filter((id) => id !== teamId))
    } else {
      setSelectedTeams([...selectedTeams, teamId])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {parentGoalId
                ? t("goals.create.subgoalTitle", "Unterziel erstellen")
                : t("goals.create.title", "Neues Ziel erstellen")}
            </DialogTitle>
            <DialogDescription>
              {t("goals.create.description", "Setzen Sie ein neues Ziel, um Ihren Fortschritt zu verfolgen")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t("goals.form.title", "Titel")} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder={t("goals.form.titlePlaceholder", "Mein Ziel...")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("goals.form.description", "Beschreibung")}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  onPaste={handlePaste}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  rows={3}
                  placeholder={t("goals.form.descriptionPlaceholder", "Beschreiben Sie Ihr Ziel...")}
                />
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Upload className="h-3 w-3" />
                  {t("goals.form.uploadHint", "Bilder einfügen: Strg+V oder Drag & Drop")}
                </p>
                {uploadedImages.length > 0 && (
                  <div className="space-y-2 mt-3 p-3 bg-muted/50 rounded-md border">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Angehängte Dateien ({uploadedImages.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {uploadedImages.map((image, index) => (
                        <div
                          key={index}
                          className="relative group bg-background rounded border p-2 flex items-center gap-2 hover:border-primary transition-colors"
                        >
                          <div className="h-12 w-12 rounded overflow-hidden bg-muted flex items-center justify-center">
                            <img
                              src={image.url || "/placeholder.svg"}
                              alt={image.fileName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate max-w-[150px]">{image.fileName}</p>
                            <p className="text-xs text-muted-foreground">{(image.fileSize / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-1 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {isUploading && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Hochladen...
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t("goals.form.category", "Kategorie")}</Label>
                <Select
                  value={formData.category || ""}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  disabled={loadingCategories}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingCategories
                          ? "Kategorien werden geladen..."
                          : t("goals.form.categoryPlaceholder", "Kategorie wählen...")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {orgaCategories.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">Keine Kategorien verfügbar</div>
                    ) : (
                      orgaCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">{t("goals.form.status", "Status")}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">{t("goals.status.notStarted", "Nicht begonnen")}</SelectItem>
                      <SelectItem value="in-progress">{t("goals.status.inProgress", "In Bearbeitung")}</SelectItem>
                      <SelectItem value="completed">{t("goals.status.completed", "Abgeschlossen")}</SelectItem>
                      <SelectItem value="cancelled">{t("goals.status.cancelled", "Abgebrochen")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">{t("goals.form.priority", "Priorität")}</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t("goals.priority.low", "Niedrig")}</SelectItem>
                      <SelectItem value="medium">{t("goals.priority.medium", "Mittel")}</SelectItem>
                      <SelectItem value="high">{t("goals.priority.high", "Hoch")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentValue">{t("goals.form.currentValue", "Aktueller Wert")}</Label>
                  <Input
                    id="currentValue"
                    type="number"
                    value={formData.currentValue || ""}
                    onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetValue">{t("goals.form.targetValue", "Zielwert")}</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    value={formData.targetValue || ""}
                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">{t("goals.form.unit", "Einheit")}</Label>
                <Input
                  id="unit"
                  value={formData.unit || ""}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder={t("goals.form.unitPlaceholder", "z.B. km, kg, Stunden, Patienten...")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("goals.form.unitHelp", "Optional: Einheit für Ziel- und Ist-Wert (z.B. Patienten, Stunden, km)")}
                </p>
              </div>

              {calculatedProgress === null && (
                <div className="space-y-2">
                  <Label htmlFor="progressPercentage">{t("goals.form.progress", "Fortschritt (%)")}</Label>
                  <Input
                    id="progressPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progressPercentage || "0"} // Add fallback for progressPercentage
                    onChange={(e) => setFormData({ ...formData, progressPercentage: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("goals.form.progressHelp", "Geben Sie den manuellen Fortschritt ein (0-100%)")}
                  </p>
                </div>
              )}

              {calculatedProgress !== null && (
                <div className="space-y-2">
                  <Label>{t("goals.form.progress", "Fortschritt")}</Label>
                  <div className="p-3 bg-muted rounded-rounded">
                    <p className="text-2xl font-bold text-primary">{displayProgress}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("goals.form.autoCalculated", "Automatisch berechnet")}: {formData.currentValue} /{" "}
                      {formData.targetValue} {formData.unit || ""}
                    </p>
                  </div>
                </div>
              )}

              {/* Added two-column grid layout for start and end dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Startdatum</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate || ""}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Enddatum</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate || ""}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Teams zuweisen
              </Label>
              {loadingTeams ? (
                <div className="flex items-center gap-2 h-16 px-3 border rounded-md bg-muted/50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Lade Teams...</span>
                </div>
              ) : teams.length > 0 ? (
                <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`goal-team-${team.id}`}
                        checked={selectedTeams.includes(team.id)}
                        onCheckedChange={() => toggleTeam(team.id)}
                      />
                      <label
                        htmlFor={`goal-team-${team.id}`}
                        className="flex items-center space-x-2 cursor-pointer flex-1"
                      >
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: team.color || "#64748b" }}
                        />
                        <span className="text-sm font-medium">{team.name}</span>
                        {team.memberCount !== undefined && (
                          <span className="text-xs text-muted-foreground">({team.memberCount} Mitglieder)</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground border rounded-md p-3">Keine Teams verfügbar</p>
              )}
              {selectedTeams.length > 0 && (
                <p className="text-xs text-muted-foreground">{selectedTeams.length} Team(s) ausgewählt</p>
              )}
            </div>

            {/* Team member selection */}
            <div className="space-y-2">
              <Label>Zugewiesene Teammitglieder</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {isTeamLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Lade Teammitglieder...</span>
                  </div>
                ) : teamMembers && teamMembers.length > 0 ? (
                  teamMembers.filter(isActiveMember).map((member) => (
                    <div key={member.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`member-${member.id}`}
                        checked={selectedTeamMembers.includes(member.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTeamMembers([...selectedTeamMembers, member.id])
                          } else {
                            setSelectedTeamMembers(selectedTeamMembers.filter((id) => id !== member.id))
                          }
                        }}
                      />
                      <label
                        htmlFor={`member-${member.id}`}
                        className="flex items-center space-x-2 cursor-pointer flex-1"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.avatar || ""} />
                          <AvatarFallback className="text-xs">
                            {member.name?.split(" ")[0]?.[0]?.toUpperCase() || ""}
                            {member.name?.split(" ")[1]?.[0]?.toUpperCase() || ""}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member.name || member.email}</span>
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Keine Teammitglieder verfügbar</p>
                )}
              </div>
              {selectedTeamMembers.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedTeamMembers.length} Teammitglied(er) ausgewählt
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between"
                onClick={() => setShowExtended(!showExtended)}
              >
                <span className="font-semibold">{t("goals.form.extendedSettings", "Erweiterte Einstellungen")}</span>
                {showExtended ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {showExtended && (
                <div className="space-y-4 mt-4">
                  {availableGoals.length > 0 && (
                    <div className="flex items-center justify-between space-x-2 pb-2 border-b">
                      <Label htmlFor="createAsSubgoal" className="flex-1">
                        {t("goals.form.createAsSubgoal", "Als Unterziel erstellen")}
                        <p className="text-sm text-muted-foreground font-normal">
                          {parentGoalId
                            ? t("goals.form.subgoalAutomatic", "Dieses Ziel wird als Unterziel erstellt")
                            : t("goals.form.createAsSubgoalHelp", "Dieses Ziel einem übergeordneten Ziel zuordnen")}
                        </p>
                      </Label>
                      <Switch
                        id="createAsSubgoal"
                        checked={createAsSubgoal}
                        onCheckedChange={(checked) => {
                          setCreateAsSubgoal(checked)
                          if (!checked) {
                            setFormData({ ...formData, parentGoalId: "" })
                          }
                        }}
                        disabled={!!parentGoalId}
                      />
                    </div>
                  )}

                  {availableGoals.length > 0 && createAsSubgoal && !parentGoalId && (
                    <div className="space-y-2">
                      <Label htmlFor="parentGoal">{t("goals.form.parentGoal", "Übergeordnetes Ziel")} *</Label>
                      <Select
                        value={formData.parentGoalId}
                        onValueChange={(value) => setFormData({ ...formData, parentGoalId: value })}
                        required={createAsSubgoal}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("goals.form.selectParentGoal", "Übergeordnetes Ziel auswählen")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableGoals.map((goal) => (
                            <SelectItem key={goal.id} value={goal.id}>
                              {goal.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {parentGoalId && (
                    <div className="space-y-2">
                      <Label>{t("goals.form.parentGoal", "Übergeordnetes Ziel")}</Label>
                      <div className="p-3 bg-muted rounded-md text-sm">
                        {availableGoals.find((g) => g.id === parentGoalId)?.title ||
                          t("goals.form.parentGoalSelected", "Übergeordnetes Ziel ausgewählt")}
                      </div>
                    </div>
                  )}

                  {availableParameters.length > 0 && (
                    <div className="space-y-2 border-t border-b py-3">
                      <Label htmlFor="linkedParameter" className="flex items-center gap-2">
                        <Link className="h-4 w-4" />
                        {t("goals.form.linkedParameter", "Mit KPI-Parameter verknüpfen (optional)")}
                      </Label>
                      <Select
                        value={formData.linkedParameterId}
                        onValueChange={(value) => {
                          setFormData({ ...formData, linkedParameterId: value === "none" ? "" : value })
                          const param = availableParameters.find((p) => p.id === value)
                          if (param?.unit && !formData.unit) {
                            setFormData((prev) => ({ ...prev, unit: param.unit }))
                          }
                          if (value && value !== "none") {
                            fetchLatestParameterValue(value)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("goals.form.selectParameter", "KPI-Parameter auswählen (optional)")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("goals.form.noParameter", "Kein Parameter")}</SelectItem>
                          {availableParameters.map((param) => (
                            <SelectItem key={param.id} value={param.id}>
                              {param.name} {param.unit ? `(${param.unit})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.linkedParameterId && (
                        <p className="text-xs text-muted-foreground">
                          {t(
                            "goals.form.linkedParameterHelp",
                            "Der aktuelle Wert wird automatisch aus den KPI-Daten aktualisiert",
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {availableParameters.length === 0 && (
                    <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                      {t(
                        "goals.form.noParametersAvailable",
                        "Keine KPI-Parameter verfügbar. Erstellen Sie zuerst Parameter in den Einstellungen.",
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log("[v0] Cancel button clicked")
                onOpenChange(false)
              }}
              disabled={loading || isSubmitting}
            >
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={
                loading || isSubmitting || userLoading || (createAsSubgoal && !formData.parentGoalId && !parentGoalId)
              }
            >
              {loading || isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.creating", "Wird erstellt...")}
                </>
              ) : (
                t("goals.create.submit", "Ziel erstellen")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateGoalDialog

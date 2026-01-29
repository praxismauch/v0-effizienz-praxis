"use client"

import type React from "react"
import { Textarea } from "@/components/ui/textarea"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTranslation } from "@/contexts/translation-context"
import { Link, ChevronDown, ChevronUp, X, Upload, Type as type, File, Users, Loader2, Settings } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useTeam } from "@/contexts/team-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { isActiveMember } from "@/lib/utils/team-member-filter"
import { SWR_KEYS } from "@/lib/swr-keys"
import { swrFetcher } from "@/lib/swr-fetcher"
import OrgaCategorySelect from "@/components/orga-category-select" // Import OrgaCategorySelect

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

  // Derive state from SWR data
  const availableGoals = goalsData?.goals || []
  const availableParameters = parametersData?.parameters || []
  const rawTeams = Array.isArray(teamsData) ? teamsData : []
  const teams: Team[] = rawTeams.filter((t: Team) => t.isActive !== false)

  // Process categories with deduplication
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

  const [loading, setLoading] = useState(false)
  const [createAsSubgoal, setCreateAsSubgoal] = useState(!!parentGoalId)
  const [showExtended, setShowExtended] = useState(false)
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; fileName: string; fileSize: number }>>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Use context team members directly (already SWR-enabled from Batch SWR-1)
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

  const displayProgress =
    calculatedProgress !== null ? calculatedProgress : Number.parseInt(formData.progressPercentage, 10)

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

  // ... existing code for handlePaste, uploadImage, handleDrop, handleDragOver, removeImage ...
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

  // Added onPaste to DialogContent
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl" onPaste={handlePaste}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("goals.create.title", "Neues Ziel erstellen")}</DialogTitle>
            <DialogDescription>{t("goals.create.description", "Erstellen Sie ein neues Ziel")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("goals.form.title", "Titel")} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("goals.form.description", "Beschreibung")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goalType">{t("goals.form.goalType", "Zieltyp")}</Label>
                <Select
                  value={formData.goalType}
                  onValueChange={(value: any) => setFormData({ ...formData, goalType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">{t("goals.type.personal", "Persönlich")}</SelectItem>
                    <SelectItem value="team">{t("goals.type.team", "Team")}</SelectItem>
                    <SelectItem value="practice">{t("goals.type.practice", "Praxis")}</SelectItem>
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentValue">{t("goals.form.currentValue", "Aktueller Wert")}</Label>
                <Input
                  id="currentValue"
                  type="number"
                  step="any"
                  value={formData.currentValue}
                  onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                  placeholder="z.B. 5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetValue">{t("goals.form.targetValue", "Zielwert")} *</Label>
                <Input
                  id="targetValue"
                  type="number"
                  step="any"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  required
                  placeholder="z.B. 10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">{t("goals.form.unit", "Einheit")} *</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                  placeholder="z.B. Stunden, %, kg"
                />
              </div>
            </div>

            {calculatedProgress === null && (
              <div className="space-y-2">
                <Label htmlFor="progress">{t("goals.form.progress", "Fortschritt (%)")}</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progressPercentage}
                  onChange={(e) => setFormData({ ...formData, progressPercentage: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Startdatum</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Enddatum</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Category Selection */}
            <OrgaCategorySelect
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              categories={orgaCategories}
              showLabel={true}
              label="Kategorie"
            />

            {/* Team Assignment */}
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
                        id={`team-${team.id}`}
                        checked={selectedTeams.includes(team.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTeams([...selectedTeams, team.id])
                          } else {
                            setSelectedTeams(selectedTeams.filter((id) => id !== team.id))
                          }
                        }}
                      />
                      <label htmlFor={`team-${team.id}`} className="flex items-center space-x-2 cursor-pointer flex-1">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: team.color || "#64748b" }}
                        />
                        <span className="text-sm font-medium">{team.name}</span>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground border rounded-md p-3">Keine Teams verfügbar</p>
              )}
            </div>

            {/* Team Members Assignment */}
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

            {/* Extended Settings */}
            <div className="border-t pt-4">
              <button
                type="button"
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200 ${
                  showExtended 
                    ? "bg-primary/5 border-primary/20 shadow-sm" 
                    : "bg-muted/30 border-border hover:bg-muted/50 hover:border-muted-foreground/20"
                }`}
                onClick={() => setShowExtended(!showExtended)}
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md transition-colors ${showExtended ? "bg-primary/10" : "bg-muted"}`}>
                    <Settings className={`h-4 w-4 transition-colors ${showExtended ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`font-medium transition-colors ${showExtended ? "text-primary" : "text-foreground"}`}>
                    {t("goals.form.extendedSettings", "Erweiterte Einstellungen")}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showExtended ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
              </button>

              {showExtended && (
                <div className="space-y-4 mt-4 pl-2 border-l-2 border-primary/20">
                  <div className="space-y-2">
                    <Label htmlFor="unit">{t("goals.form.unit", "Einheit")}</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder={t("goals.form.unitPlaceholder", "z.B. Patienten, €")}
                    />
                  </div>

                  {/* Parent Goal Selection */}
                  {!parentGoalId && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="createAsSubgoal"
                          checked={createAsSubgoal}
                          onCheckedChange={(checked) => setCreateAsSubgoal(!!checked)}
                        />
                        <Label htmlFor="createAsSubgoal">Als Unterziel erstellen</Label>
                      </div>

                      {createAsSubgoal && (
                        <Select
                          value={formData.parentGoalId}
                          onValueChange={(value) => setFormData({ ...formData, parentGoalId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Übergeordnetes Ziel wählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableGoals.map((goal: any) => (
                              <SelectItem key={goal.id} value={goal.id}>
                                {goal.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Parameter Link */}
                  <div className="space-y-2">
                    <Label htmlFor="linkedParameter">
                      <Link className="h-4 w-4 inline mr-2" />
                      Mit Kennzahl verknüpfen
                    </Label>
                    <Select
                      value={formData.linkedParameterId}
                      onValueChange={(value) => {
                        setFormData({ ...formData, linkedParameterId: value })
                        if (value && value !== "none") {
                          fetchLatestParameterValue(value)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kennzahl wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Keine Verknüpfung</SelectItem>
                        {availableParameters.map((param: any) => (
                          <SelectItem key={param.id} value={param.id}>
                            {param.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="isPrivate" className="flex-1">
                      {t("goals.form.private", "Privates Ziel")}
                      <p className="text-sm text-muted-foreground font-normal">
                        {t(
                          "goals.form.privateDescription",
                          "Nur Sie und Praxisadministratoren können dieses Ziel sehen",
                        )}
                      </p>
                    </Label>
                    <Switch
                      id="isPrivate"
                      checked={formData.isPrivate}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label>Bilder anhängen</Label>
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      {isUploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Wird hochgeladen...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Bilder hier ablegen oder Strg+V zum Einfügen</p>
                        </div>
                      )}
                    </div>

                    {uploadedImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {uploadedImages.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={img.url || "/placeholder.svg"}
                              alt={img.fileName}
                              className="w-16 h-16 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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

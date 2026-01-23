"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePractice } from "@/contexts/practice-context"
import { useTeam } from "@/contexts/team-context"
import { useUser } from "@/contexts/user-context"
import { useAuth } from "@/contexts/auth-context"
import { useTranslation } from "@/contexts/translation-context"
import { Loader2, Link, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { isActiveMember } from "@/lib/utils/team-member-filter"
import { SWR_KEYS } from "@/lib/swr-keys"
import { swrFetcher } from "@/lib/swr-fetcher"

interface Goal {
  id: string
  title: string
  description?: string
  goalType: "practice" | "personal" | "team"
  targetValue?: number
  currentValue?: number
  unit?: string
  progressPercentage: number
  status: "not-started" | "in-progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high"
  startDate: string
  dueDate: string
  isPrivate: boolean
  linkedParameterId?: string
  showOnDashboard?: boolean
  category?: string
  assignedTo?: string
  progress?: number
  practice_id?: string
  orgaCategoryId?: string
}

interface EditGoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: Goal
  onGoalUpdated: () => void
}

export function EditGoalDialogComponent({ open, onOpenChange, goal, onGoalUpdated }: EditGoalDialogProps) {
  const { currentPractice } = usePractice()
  const { teamMembers, loading: teamLoading } = useTeam()
  const { currentUser: user } = useUser()
  const { user: authUser } = useAuth()
  const { t } = useTranslation()
  const { toast } = useToast()

  const effectiveUser = user || authUser
  const getEffectivePracticeId = () => {
    const practiceId = currentPractice?.id || goal?.practice_id || effectiveUser?.practice_id
    return practiceId && practiceId !== "0" && practiceId !== "undefined" ? practiceId : "1"
  }
  const effectivePracticeId = getEffectivePracticeId()

  const { data: parametersData } = useSWR(
    open && effectivePracticeId ? SWR_KEYS.parameters(effectivePracticeId) : null,
    swrFetcher,
  )

  const { data: assignmentsData, mutate: mutateAssignments } = useSWR(
    open && effectivePracticeId && goal?.id ? SWR_KEYS.goalAssignments(effectivePracticeId, goal.id) : null,
    swrFetcher,
  )

  const { data: subgoalsData } = useSWR(
    open && effectivePracticeId && goal?.id
      ? `${SWR_KEYS.goals(effectivePracticeId)}?includeSubgoals=true&parentGoalId=${goal.id}`
      : null,
    swrFetcher,
  )

  // Derive state from SWR data
  const availableParameters = parametersData?.parameters || []
  const hasSubgoals = (subgoalsData?.goals || []).filter((g: any) => g.parentGoalId === goal.id).length > 0
  const initialAssignments = (assignmentsData?.assignments || []).map((a: any) => a.team_member_id)

  const [loading, setLoading] = useState(false)
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([])
  const [showExtended, setShowExtended] = useState(false)

  const [formData, setFormData] = useState({
    title: goal.title,
    description: goal.description || "",
    goalType: goal.goalType,
    unit: goal.unit || "",
    status: goal.status,
    priority: goal.priority,
    assignedTo: goal.assignedTo || "",
    startDate: goal.startDate || "",
    dueDate: goal.dueDate || "",
    progress: goal.progress || goal.progressPercentage || 0,
    linkedParameterId: goal.linkedParameterId || "",
    category: goal.category || "",
    orgaCategoryId: goal.orgaCategoryId || "",
    isPrivate: goal.isPrivate,
    currentValue: goal.currentValue?.toString() || "",
    targetValue: goal.targetValue?.toString() || "",
  })

  useEffect(() => {
    setFormData({
      title: goal.title,
      description: goal.description || "",
      goalType: goal.goalType,
      unit: goal.unit || "",
      status: goal.status,
      priority: goal.priority,
      assignedTo: goal.assignedTo || "",
      startDate: goal.startDate || "",
      dueDate: goal.dueDate || "",
      progress: goal.progress || goal.progressPercentage || 0,
      linkedParameterId: goal.linkedParameterId || "",
      category: goal.category || "",
      orgaCategoryId: goal.orgaCategoryId || "",
      isPrivate: goal.isPrivate,
      currentValue: goal.currentValue?.toString() || "",
      targetValue: goal.targetValue?.toString() || "",
    })
  }, [goal])

  useEffect(() => {
    if (initialAssignments.length > 0) {
      setSelectedTeamMembers(initialAssignments)
    }
  }, [assignmentsData])

  const fetchLatestParameterValue = async (parameterId: string) => {
    if (!parameterId || parameterId === "none") return

    try {
      const response = await fetch(
        `/api/practices/${effectivePracticeId}/parameter-values?parameterId=${parameterId}&limit=1`,
        { credentials: "include" },
      )
      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          const latestValue = data[0].value
          setFormData((prev) => ({ ...prev, currentValue: latestValue.toString() }))
        }
      }
    } catch (error) {
      console.error("Error fetching latest parameter value:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!effectivePracticeId) return

    setLoading(true)
    try {
      const goalData = {
        title: formData.title,
        description: formData.description || null,
        goalType: formData.goalType,
        currentValue: formData.currentValue ? Number.parseFloat(formData.currentValue) : null,
        targetValue: formData.targetValue ? Number.parseFloat(formData.targetValue) : null,
        unit: formData.unit || null,
        progressPercentage: formData.progress,
        priority: formData.priority,
        status: formData.status,
        startDate: formData.startDate || null,
        endDate: formData.dueDate || null,
        isPrivate: formData.isPrivate,
        linkedParameterId: formData.linkedParameterId || null,
        category: formData.category || null,
      }

      const response = await fetch(`/api/practices/${effectivePracticeId}/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(goalData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update goal")
      }

      // Update team member assignments (always sync to handle removals too)
      await fetch(`/api/practices/${effectivePracticeId}/goals/${goal.id}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          teamMemberIds: selectedTeamMembers,
          assignedBy: effectiveUser?.id,
        }),
      })
      mutateAssignments()

      toast({
        title: "Erfolg",
        description: "Ziel wurde erfolgreich aktualisiert",
      })

      onGoalUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating goal:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren des Ziels",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculatedProgress = (() => {
    const current = Number.parseFloat(formData.currentValue)
    const target = Number.parseFloat(formData.targetValue)
    if (isNaN(current) || isNaN(target) || target === 0) return null
    return Math.min(100, Math.max(0, Math.round((current / target) * 100)))
  })()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("goals.edit.title", "Ziel bearbeiten")}</DialogTitle>
            <DialogDescription>
              {t("goals.edit.description", "Bearbeiten Sie die Details Ihres Ziels")}
            </DialogDescription>
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
                  value={formData.currentValue}
                  onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetValue">{t("goals.form.targetValue", "Zielwert")}</Label>
                <Input
                  id="targetValue"
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
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
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
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
                <Label htmlFor="dueDate">Enddatum</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            {/* Team member selection */}
            <div className="space-y-2">
              <Label>Zugewiesene Teammitglieder</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {teamLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Lade Teammitglieder...</span>
                  </div>
                ) : teamMembers && teamMembers.length > 0 ? (
                  teamMembers.filter(isActiveMember).map((member) => (
                    <div key={member.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`edit-member-${member.id}`}
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
                        htmlFor={`edit-member-${member.id}`}
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

            {/* Extended settings */}
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
                  <div className="space-y-2">
                    <Label htmlFor="unit">{t("goals.form.unit", "Einheit")}</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder={t("goals.form.unitPlaceholder", "z.B. Patienten, €")}
                    />
                  </div>

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

                  {hasSubgoals && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                      Dieses Ziel hat Unterziele. Änderungen am Status können sich auf die Unterziele auswirken.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("common.saving", "Wird gespeichert...")}
                </>
              ) : (
                t("common.save", "Speichern")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditGoalDialogComponent

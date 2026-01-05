"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Target, Calendar, User, Trash2, Edit, Plus, ChevronDown, ChevronRight, GripVertical, Link } from "lucide-react"
import { formatDateDE } from "@/lib/utils"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTranslation } from "@/contexts/translation-context"
import EditGoalDialog from "@/components/edit-goal-dialog"
import CreateGoalDialog from "@/components/create-goal-dialog"
import { cn } from "@/lib/utils"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"

interface Goal {
  id: string
  practiceId: string
  createdBy: string
  assignedTo?: string
  parentGoalId?: string
  title: string
  description?: string
  goalType: "practice" | "personal" | "team"
  targetValue?: number
  currentValue?: number
  unit?: string
  progressPercentage: number
  status: "not-started" | "in-progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high"
  startDate?: string
  endDate: string
  completedAt?: string
  isPrivate: boolean
  metadata: any
  createdAt: string
  updatedAt: string
  linkedParameterId?: string
}

interface GoalCardProps {
  goal: Goal
  onUpdate: () => void
  onDelete: () => void
  depth?: number
}

export function GoalCard({ goal, onUpdate, onDelete, depth = 0 }: GoalCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: goal.id,
    disabled: depth > 0,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const { currentUser, isAdmin } = useUser()
  const { currentPractice } = usePractice()
  const { t } = useTranslation()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createSubgoalOpen, setCreateSubgoalOpen] = useState(false)
  const [showSubgoals, setShowSubgoals] = useState(true)
  const [subgoals, setSubgoals] = useState<Goal[]>([])
  const [loadingSubgoals, setLoadingSubgoals] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [linkedParameterName, setLinkedParameterName] = useState<string | null>(null)
  const [assignedMembers, setAssignedMembers] = useState<any[]>([])

  const canEdit = isAdmin || goal.createdBy === currentUser?.id || goal.assignedTo === currentUser?.id
  const canDelete = isAdmin || goal.createdBy === currentUser?.id

  useEffect(() => {
    if (currentPractice?.id && depth === 0) {
      fetchSubgoals()
    }
  }, [currentPractice?.id, goal.id, depth])

  useEffect(() => {
    if (currentPractice?.id) {
      fetchAssignedMembers()
    }
  }, [currentPractice?.id, goal.id])

  useEffect(() => {
    if (currentPractice?.id && goal.linkedParameterId) {
      fetchLinkedParameterName()
    }
  }, [currentPractice?.id, goal.linkedParameterId])

  const fetchSubgoals = async () => {
    if (!currentPractice?.id) return

    try {
      setLoadingSubgoals(true)
      const response = await fetch(
        `/api/practices/${currentPractice.id}/goals?includeSubgoals=true&parentGoalId=${goal.id}`,
        { credentials: "include" },
      )
      if (response.ok) {
        const data = await response.json()
        const filteredSubgoals = (data.goals || []).filter((g: Goal) => g.parentGoalId === goal.id)
        setSubgoals(filteredSubgoals)
      }
    } catch (error) {
      console.error("Error fetching sub-goals:", error)
    } finally {
      setLoadingSubgoals(false)
    }
  }

  const fetchAssignedMembers = async () => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/goals/${goal.id}/assignments`, {
        credentials: "include",
      })
      if (response.ok) {
        const { assignments } = await response.json()
        setAssignedMembers(assignments || [])
      }
    } catch (error) {
      console.error("Error fetching assigned members:", error)
    }
  }

  const fetchLinkedParameterName = async () => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameters`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        const parameter = (data.parameters || []).find((p: any) => p.id === goal.linkedParameterId)
        if (parameter) {
          setLinkedParameterName(parameter.name)
        }
      }
    } catch (error) {
      console.error("Error fetching linked parameter:", error)
    }
  }

  const handleDelete = async () => {
    if (!currentPractice?.id) return

    if (!confirm("Sind Sie sicher, dass Sie dieses Ziel löschen möchten?")) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/practices/${currentPractice.id}/goals/${goal.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        toast({
          title: "Ziel gelöscht",
          description: "Das Ziel wurde erfolgreich gelöscht.",
        })
        onDelete()
      } else {
        toast({
          title: "Fehler",
          description: "Das Ziel konnte nicht gelöscht werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting goal:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist beim Löschen aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleSubgoalCreated = () => {
    setCreateSubgoalOpen(false)
    fetchSubgoals()
    onUpdate()
  }

  const handleSubgoalUpdate = () => {
    fetchSubgoals()
    onUpdate()
  }

  const handleUpdateStatus = async (newStatus: Goal["status"]) => {
    if (!canEdit || updatingStatus || !currentPractice?.id) return

    try {
      setUpdatingStatus(true)
      const response = await fetch(`/api/practices/${currentPractice.id}/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("Error updating goal status:", error)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const priorityColors = {
    low: "bg-gray-500/10 text-gray-500",
    medium: "bg-blue-500/10 text-blue-500",
    high: "bg-red-500/10 text-red-500",
  }

  const statusColors = {
    "not-started": "bg-gray-500/10 text-gray-500",
    "in-progress": "bg-blue-500/10 text-blue-500",
    completed: "bg-green-500/10 text-green-500",
    cancelled: "bg-red-500/10 text-red-500",
  }

  const typeLabels = {
    practice: "Praxis",
    personal: "Privat",
    team: "Team",
  }

  const statusLabels = {
    "not-started": "Nicht begonnen",
    "in-progress": "In Bearbeitung",
    completed: "Abgeschlossen",
    cancelled: "Abgebrochen",
  }

  const priorityLabels = {
    low: "Niedrig",
    medium: "Mittel",
    high: "Hoch",
  }

  const completedSubgoalsCount = subgoals.filter((sg) => sg.status === "completed").length

  const typeColors = {
    practice: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    personal:
      "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    team: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  }

  return (
    <>
      <div ref={setNodeRef} style={style} className={cn("space-y-2", depth > 0 && "relative")}>
        <Card
          className={cn(
            "p-4 hover:shadow-lg transition-shadow group",
            depth > 0 && "ml-8 border-l-4 border-l-primary/50 bg-muted/30",
          )}
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                {depth > 0 && (
                  <div className="flex items-center gap-1 mt-1 shrink-0">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Link className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </div>
                )}
                {depth === 0 && (
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hover:text-foreground transition-colors"
                          {...attributes}
                          {...listeners}
                        >
                          <GripVertical className="h-5 w-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ziel verschieben</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {depth === 0 && subgoals.length > 0 && (
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 mt-1"
                          onClick={() => setShowSubgoals(!showSubgoals)}
                        >
                          {showSubgoals ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{showSubgoals ? "Unterziele ausblenden" : "Unterziele anzeigen"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {depth > 0 && (
                      <Badge variant="outline" className="bg-primary/10 text-primary text-xs h-5">
                        Unterziel
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg text-foreground truncate">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{goal.description}</p>
                  )}
                </div>
              </div>
              {(canEdit || canDelete) && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {canEdit && (
                    <>
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setEditDialogOpen(true)}
                              title="Bearbeiten"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Bearbeiten</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {depth === 0 && (
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setCreateSubgoalOpen(true)}
                                title="Unterziel hinzufügen"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Unterziel hinzufügen</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </>
                  )}
                  {canDelete && (
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Löschen</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!canEdit || updatingStatus}>
                  <Badge
                    variant="outline"
                    className={cn(
                      statusColors[goal.status],
                      canEdit && "cursor-pointer hover:bg-muted/50 transition-colors",
                      updatingStatus && "opacity-50",
                    )}
                  >
                    {statusLabels[goal.status]}
                    {canEdit && <ChevronDown className="ml-1 h-3 w-3" />}
                  </Badge>
                </DropdownMenuTrigger>
                {canEdit && (
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleUpdateStatus("not-started")} className="hover:bg-muted">
                      <Badge variant="outline" className={cn("mr-2", statusColors["not-started"])}>
                        {statusLabels["not-started"]}
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateStatus("in-progress")} className="hover:bg-muted">
                      <Badge variant="outline" className={cn("mr-2", statusColors["in-progress"])}>
                        {statusLabels["in-progress"]}
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateStatus("completed")} className="hover:bg-muted">
                      <Badge variant="outline" className={cn("mr-2", statusColors["completed"])}>
                        {statusLabels["completed"]}
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateStatus("cancelled")} className="hover:bg-muted">
                      <Badge variant="outline" className={cn("mr-2", statusColors["cancelled"])}>
                        {statusLabels["cancelled"]}
                      </Badge>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                )}
              </DropdownMenu>
              <Badge variant="outline" className={priorityColors[goal.priority]}>
                {priorityLabels[goal.priority]}
              </Badge>
              {depth === 0 && subgoals.length > 0 && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                  {completedSubgoalsCount}/{subgoals.length} Unterziele abgeschlossen
                </Badge>
              )}
              <Badge variant="outline" className={typeColors[goal.goalType]}>
                <Target className="mr-1 h-3 w-3" />
                {typeLabels[goal.goalType]}
              </Badge>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fortschritt</span>
                <span className="font-semibold">{goal.progressPercentage}%</span>
              </div>
              <Progress value={goal.progressPercentage} className="h-2" />
              {goal.targetValue && goal.unit && (
                <div className="text-xs text-muted-foreground">
                  {goal.currentValue} / {goal.targetValue} {goal.unit}
                </div>
              )}
              {goal.linkedParameterId && linkedParameterName && (
                <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                  <Link className="h-3 w-3" />
                  <span>Verknüpft mit KPI: {linkedParameterName}</span>
                </div>
              )}
              {depth === 0 && subgoals.length > 0 && (
                <div className="text-xs text-muted-foreground italic">
                  Fortschritt wird automatisch aus Unterzielen berechnet
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
              {goal.endDate && (
                <div className="flex items-center gap-1">
                  <Calendar
                    className={cn(
                      "h-3 w-3",
                      new Date(goal.endDate) < new Date() && goal.status !== "completed" && "text-red-500",
                    )}
                  />
                  <span
                    className={cn(
                      new Date(goal.endDate) < new Date() &&
                        goal.status !== "completed" &&
                        "text-red-500 font-semibold",
                    )}
                  >
                    {formatDateDE(goal.endDate)}
                  </span>
                </div>
              )}
              {goal.assignedTo && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span className="text-xs">Zugewiesen</span>
                </div>
              )}
            </div>

            {/* Assigned Team Members */}
            {assignedMembers.length > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-1 flex-wrap">
                  {assignedMembers.map((assignment) => {
                    const member = assignment.team_members
                    const firstName = member?.users?.first_name || member?.name?.split(" ")[0] || ""
                    const lastName = member?.users?.last_name || member?.name?.split(" ")[1] || ""
                    const fullName = member?.name || `${firstName} ${lastName}`.trim()
                    const initials =
                      firstName && lastName
                        ? `${firstName[0]}${lastName[0]}`
                        : fullName
                          ? fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : "?"

                    return (
                      <TooltipProvider key={assignment.id}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Avatar className="h-6 w-6 border-2 border-background">
                              <AvatarImage src={member?.users?.avatar || member?.avatar_url} />
                              <AvatarFallback className="text-xs bg-primary/10">{initials}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">{fullName || member?.email || "Unbekannt"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                  <span className="text-xs text-muted-foreground ml-1">
                    {assignedMembers.length} {assignedMembers.length === 1 ? "Teammitglied" : "Teammitglieder"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {depth === 0 && showSubgoals && subgoals.length > 0 && (
          <div className="relative space-y-3 pt-2">
            {/* Visual connecting line from parent to children */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />

            {subgoals.map((subgoal) => (
              <GoalCard
                key={subgoal.id}
                goal={subgoal}
                onUpdate={handleSubgoalUpdate}
                onDelete={handleSubgoalUpdate}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>

      <EditGoalDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        goal={goal}
        onGoalUpdated={() => {
          setEditDialogOpen(false)
          onUpdate()
        }}
      />

      <CreateGoalDialog
        open={createSubgoalOpen}
        onOpenChange={setCreateSubgoalOpen}
        onGoalCreated={handleSubgoalCreated}
        parentGoalId={goal.id}
      />
    </>
  )
}

export default GoalCard

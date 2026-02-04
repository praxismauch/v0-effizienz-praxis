"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWorkflow, type Workflow, type WorkflowStep } from "@/contexts/workflow-context"
import { useTeam } from "@/contexts/team-context"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import {
  CheckCircle2,
  Clock,
  Play,
  Pause,
  MoreHorizontal,
  User,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Edit,
  Trash2,
  Save,
  X,
  Settings,
  ListTodo,
} from "lucide-react"
import { formatDateTimeDE } from "@/lib/utils"

interface WorkflowDetailDialogProps {
  workflow: Workflow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const categoryLabels: Record<string, string> = {
  administrative: "Administrativ",
  clinical: "Klinisch",
  patient_care: "Patientenversorgung",
  communication: "Kommunikation",
  financial: "Finanzen",
  hr: "Personal",
  compliance: "Compliance",
  marketing: "Marketing",
  other: "Sonstiges",
}

const priorityLabels: Record<string, string> = {
  urgent: "Dringend",
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
}

export function WorkflowDetailDialog({ workflow, open, onOpenChange }: WorkflowDetailDialogProps) {
  const { updateWorkflow, updateWorkflowStep, deleteWorkflow } = useWorkflow()
  const { teamMembers: contextTeamMembers, loading: teamLoading } = useTeam()
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [selectedStep, setSelectedStep] = useState<string | null>(null)
  const [stepNotes, setStepNotes] = useState("")
  const [activeTab, setActiveTab] = useState<"steps" | "settings">("steps")

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as "urgent" | "high" | "medium" | "low",
  })

  const [localTeamMembers, setLocalTeamMembers] = useState<any[]>([])

  const teamMembers = contextTeamMembers?.length > 0 ? contextTeamMembers : localTeamMembers

  useEffect(() => {
    if (workflow) {
      setEditForm({
        title: workflow.title || "",
        description: workflow.description || "",
        category: workflow.category || "other",
        priority: workflow.priority || "medium",
      })
    }
  }, [workflow])

  useEffect(() => {
    const fetchLocalTeamMembers = async () => {
      if (!open || !currentPractice?.id) return
      if (contextTeamMembers && contextTeamMembers.length > 0) return

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/team-members`)
        if (response.ok) {
          const data = await response.json()
          const members = Array.isArray(data) ? data : data.teamMembers || data.members || []
          setLocalTeamMembers(members.filter((m: any) => m.id && m.id.trim() !== ""))
        }
      } catch (error) {
        console.error("Error fetching local team members:", error)
      }
    }

    fetchLocalTeamMembers()
  }, [open, currentPractice?.id, contextTeamMembers])

  useEffect(() => {
    if (!open) {
      setIsEditing(false)
      setActiveTab("steps")
    }
  }, [open])

  if (!workflow) return null

  const getStepProgress = () => {
    const completedSteps = workflow.steps.filter((step) => step.status === "completed").length
    return (completedSteps / workflow.steps.length) * 100
  }

  const getStepStatusColor = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "blocked":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const canStartStep = (step: WorkflowStep) => {
    return step.dependencies.every((depId) => workflow.steps.find((s) => s.id === depId)?.status === "completed")
  }

  const handleStepStatusChange = async (stepId: string, status: WorkflowStep["status"]) => {
    if (!currentPractice) return

    const updates: Partial<WorkflowStep> = { status }
    if (status === "completed") {
      updates.completedAt = new Date().toISOString()
      updates.completedBy = "Current User"
      if (stepNotes.trim()) {
        updates.notes = stepNotes
      }
    }

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/workflow-steps/${stepId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update step")

      updateWorkflowStep(workflow.id, stepId, updates)
      setSelectedStep(null)
      setStepNotes("")
    } catch (error) {
      console.error("Error updating step:", error)
    }
  }

  const getTeamMemberName = (memberId: string) => {
    return teamMembers.find((m) => m.id === memberId)?.name || memberId
  }

  const handleDeleteWorkflow = async () => {
    if (!currentPractice) return

    if (confirm("Sind Sie sicher, dass Sie diesen Workflow löschen möchten?")) {
      try {
        await deleteWorkflow(workflow.id)
        onOpenChange(false)
        toast({ title: "Workflow gelöscht", description: "Der Workflow wurde erfolgreich gelöscht." })
      } catch (error) {
        console.error("Error deleting workflow:", error)
        toast({ title: "Fehler", description: "Der Workflow konnte nicht gelöscht werden.", variant: "destructive" })
      }
    }
  }

  const handleSaveWorkflow = async () => {
    if (!currentPractice || !workflow) return

    setIsSaving(true)
    try {
      await updateWorkflow(workflow.id, {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        priority: editForm.priority,
      })

      setIsEditing(false)
      toast({ title: "Gespeichert", description: "Der Workflow wurde erfolgreich aktualisiert." })
    } catch (error) {
      console.error("Error saving workflow:", error)
      toast({ title: "Fehler", description: "Der Workflow konnte nicht gespeichert werden.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditForm({
      title: workflow.title || "",
      description: workflow.description || "",
      category: workflow.category || "other",
      priority: workflow.priority || "medium",
    })
    setIsEditing(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              {isEditing ? (
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="text-xl font-semibold"
                  placeholder="Workflow-Titel"
                />
              ) : (
                <DialogTitle className="text-xl">{workflow.title}</DialogTitle>
              )}
              {isEditing ? (
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Beschreibung des Workflows..."
                  rows={2}
                />
              ) : (
                workflow.description && <DialogDescription>{workflow.description}</DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge
                className={
                  workflow.status === "active"
                    ? "bg-blue-100 text-blue-800"
                    : workflow.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : workflow.status === "paused"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                }
              >
                {workflow.status === "active"
                  ? "Aktiv"
                  : workflow.status === "completed"
                    ? "Abgeschlossen"
                    : workflow.status === "paused"
                      ? "Pausiert"
                      : "Entwurf"}
              </Badge>

              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    <X className="mr-2 h-4 w-4" />
                    Abbrechen
                  </Button>
                  <Button size="sm" onClick={handleSaveWorkflow} disabled={isSaving || !editForm.title.trim()}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Speichern..." : "Speichern"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await updateWorkflow(workflow.id, {
                          status: workflow.status === "active" ? "paused" : "active",
                        })
                      } catch (error) {
                        console.error("Failed to start/pause workflow:", error)
                        toast({
                          title: "Fehler",
                          description: `Fehler beim ${workflow.status === "active" ? "Pausieren" : "Starten"} des Workflows`,
                          variant: "destructive",
                        })
                      }
                    }}
                  >
                    {workflow.status === "active" ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pausieren
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Starten
                      </>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={handleDeleteWorkflow}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "steps" | "settings")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="steps" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Arbeitsschritte
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Einstellungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="steps" className="space-y-6 mt-4">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fortschritt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Abgeschlossene Schritte</span>
                  <span className="font-medium">
                    {workflow.steps.filter((s) => s.status === "completed").length} / {workflow.steps.length}
                  </span>
                </div>
                <Progress value={getStepProgress()} className="h-3" />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {workflow.steps.filter((s) => s.status === "completed").length}
                    </div>
                    <div className="text-xs text-muted-foreground">Abgeschlossen</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {workflow.steps.filter((s) => s.status === "in-progress").length}
                    </div>
                    <div className="text-xs text-muted-foreground">In Bearbeitung</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600">
                      {workflow.steps.filter((s) => s.status === "pending").length}
                    </div>
                    <div className="text-xs text-muted-foreground">Ausstehend</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Workflow Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Arbeitsschritte</CardTitle>
                <CardDescription>Verwalten Sie die einzelnen Schritte dieses Workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflow.steps.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Noch keine Arbeitsschritte definiert.</p>
                    </div>
                  ) : (
                    workflow.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`border rounded-lg p-4 ${
                          step.status === "completed"
                            ? "bg-green-50 border-green-200"
                            : step.status === "in-progress"
                              ? "bg-blue-50 border-blue-200"
                              : step.status === "blocked"
                                ? "bg-red-50 border-red-200"
                                : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-current text-sm font-medium">
                              {step.status === "completed" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{step.title}</h4>
                                <Badge variant="outline" className={getStepStatusColor(step.status)}>
                                  {step.status === "completed"
                                    ? "Abgeschlossen"
                                    : step.status === "in-progress"
                                      ? "In Bearbeitung"
                                      : step.status === "blocked"
                                        ? "Blockiert"
                                        : "Ausstehend"}
                                </Badge>
                                {!canStartStep(step) && step.status === "pending" && (
                                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                    Abhängigkeiten
                                  </Badge>
                                )}
                              </div>
                              {step.description && <p className="text-sm text-muted-foreground">{step.description}</p>}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {step.assignedTo && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>{getTeamMemberName(step.assignedTo)}</span>
                                  </div>
                                )}
                                {step.estimatedDuration && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{step.estimatedDuration} Min.</span>
                                  </div>
                                )}
                                {step.completedAt && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Abgeschlossen: {formatDateTimeDE(step.completedAt)}</span>
                                  </div>
                                )}
                              </div>
                              {step.notes && (
                                <div className="bg-white rounded p-2 border">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>Notizen:</span>
                                  </div>
                                  <p className="text-sm">{step.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {step.status === "pending" && canStartStep(step) && (
                                <DropdownMenuItem onClick={() => handleStepStatusChange(step.id, "in-progress")}>
                                  <Play className="mr-2 h-4 w-4" />
                                  Starten
                                </DropdownMenuItem>
                              )}
                              {step.status === "in-progress" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedStep(step.id)
                                      setStepNotes(step.notes || "")
                                    }}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Als abgeschlossen markieren
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStepStatusChange(step.id, "blocked")}>
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Als blockiert markieren
                                  </DropdownMenuItem>
                                </>
                              )}
                              {step.status === "completed" && (
                                <DropdownMenuItem onClick={() => handleStepStatusChange(step.id, "in-progress")}>
                                  <Clock className="mr-2 h-4 w-4" />
                                  Zurück zu "In Bearbeitung"
                                </DropdownMenuItem>
                              )}
                              {step.status === "blocked" && (
                                <DropdownMenuItem onClick={() => handleStepStatusChange(step.id, "in-progress")}>
                                  <Play className="mr-2 h-4 w-4" />
                                  Blockierung aufheben
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Workflow-Einstellungen</CardTitle>
                <CardDescription>Bearbeiten Sie die grundlegenden Einstellungen des Workflows</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-title">Name</Label>
                  <Input
                    id="settings-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Name des Workflows"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-description">Beschreibung</Label>
                  <Textarea
                    id="settings-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Beschreiben Sie den Workflow..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="settings-category">Kategorie</Label>
                    <Select
                      value={editForm.category}
                      onValueChange={(value) => setEditForm((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger id="settings-category">
                        <SelectValue placeholder="Kategorie wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-priority">Priorität</Label>
                    <Select
                      value={editForm.priority}
                      onValueChange={(value: "urgent" | "high" | "medium" | "low") =>
                        setEditForm((prev) => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger id="settings-priority">
                        <SelectValue placeholder="Priorität wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveWorkflow} disabled={isSaving || !editForm.title.trim()}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Speichern..." : "Änderungen speichern"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Workflow-Informationen</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Erstellt am</dt>
                    <dd className="font-medium">{workflow.createdAt ? formatDateTimeDE(workflow.createdAt) : "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Zuletzt aktualisiert</dt>
                    <dd className="font-medium">{workflow.updatedAt ? formatDateTimeDE(workflow.updatedAt) : "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Anzahl Schritte</dt>
                    <dd className="font-medium">{workflow.steps.length}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Geschätzte Dauer</dt>
                    <dd className="font-medium">
                      {workflow.estimatedTotalDuration ? `${workflow.estimatedTotalDuration} Min.` : "-"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Complete Step Dialog */}
        {selectedStep && (
          <Dialog open={!!selectedStep} onOpenChange={() => setSelectedStep(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schritt abschließen</DialogTitle>
                <DialogDescription>
                  Fügen Sie optional Notizen hinzu und markieren Sie den Schritt als abgeschlossen.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes">Notizen (optional)</Label>
                  <Textarea
                    id="notes"
                    value={stepNotes}
                    onChange={(e) => setStepNotes(e.target.value)}
                    placeholder="Fügen Sie Notizen oder Kommentare hinzu..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedStep(null)}>
                  Abbrechen
                </Button>
                <Button onClick={() => handleStepStatusChange(selectedStep, "completed")}>
                  Als abgeschlossen markieren
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default WorkflowDetailDialog

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWorkflow, type Workflow, type WorkflowStep } from "@/contexts/workflow-context"
import { useTeam } from "@/contexts/team-context"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import { Play, Pause, MoreHorizontal, Edit, Trash2, Save, X, Settings, ListTodo } from "lucide-react"
import { StepsTab } from "./workflow-detail/steps-tab"
import { SettingsTab } from "./workflow-detail/settings-tab"
import { CompleteStepDialog } from "./workflow-detail/complete-step-dialog"

interface WorkflowDetailDialogProps {
  workflow: Workflow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  initialEditing?: boolean
}

export function WorkflowDetailDialog({ workflow, open, onOpenChange, initialEditing = false }: WorkflowDetailDialogProps) {
  const { updateWorkflow, updateWorkflowStep, deleteWorkflow } = useWorkflow()
  const { teamMembers: contextTeamMembers } = useTeam()
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
    } else if (initialEditing) {
      setIsEditing(true)
      setActiveTab("settings")
    }
  }, [open, initialEditing])

  if (!workflow) return null

  const getTeamMemberName = (memberId: string) => {
    return teamMembers.find((m) => m.id === memberId)?.name || memberId
  }

  const handleStepStatusChange = async (stepId: string, status: WorkflowStep["status"]) => {
    if (!currentPractice) return
    const updates: Partial<WorkflowStep> = { status }
    if (status === "completed") {
      updates.completedAt = new Date().toISOString()
      updates.completedBy = "Current User"
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

  const handleCompleteStep = async (stepId: string, notes: string) => {
    if (!currentPractice) return
    const updates: Partial<WorkflowStep> = {
      status: "completed",
      completedAt: new Date().toISOString(),
      completedBy: "Current User",
      ...(notes.trim() ? { notes } : {}),
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
      console.error("Error completing step:", error)
    }
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

          <TabsContent value="steps" className="mt-4">
            <StepsTab
              workflow={workflow}
              getTeamMemberName={getTeamMemberName}
              onStepStatusChange={handleStepStatusChange}
              onCompleteClick={(stepId, notes) => {
                setSelectedStep(stepId)
                setStepNotes(notes)
              }}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <SettingsTab
              workflow={workflow}
              editForm={editForm}
              isSaving={isSaving}
              onEditFormChange={setEditForm}
              onSave={handleSaveWorkflow}
            />
          </TabsContent>
        </Tabs>

        <CompleteStepDialog
          stepId={selectedStep}
          initialNotes={stepNotes}
          onComplete={handleCompleteStep}
          onClose={() => setSelectedStep(null)}
        />
      </DialogContent>
    </Dialog>
  )
}

export default WorkflowDetailDialog

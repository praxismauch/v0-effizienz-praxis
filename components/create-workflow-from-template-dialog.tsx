"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useWorkflow, type WorkflowTemplate } from "@/contexts/workflow-context"
import { useTeam } from "@/contexts/team-context"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { Clock, User, ListChecks, EyeOff, Check, ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import { isActiveMember } from "@/lib/utils/team-member-filter"

interface CreateWorkflowFromTemplateDialogProps {
  template: WorkflowTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (workflow: any) => void
}

interface StepAssignment {
  title: string
  assignedUserId?: string
  assignedTo?: string
  subitems?: StepAssignment[]
}

export function CreateWorkflowFromTemplateDialog({
  template,
  open,
  onOpenChange,
  onSuccess,
}: CreateWorkflowFromTemplateDialogProps) {
  const { createWorkflowFromTemplate } = useWorkflow()
  const { teamMembers: contextTeamMembers, loading: teamLoading } = useTeam()
  const { currentPractice } = usePractice()
  const { user } = useUser()

  const [workflowName, setWorkflowName] = useState("")
  const [workflowDescription, setWorkflowDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium")
  const [stepAssignments, setStepAssignments] = useState<StepAssignment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())

  const [localTeamMembers, setLocalTeamMembers] = useState<any[]>([])
  const [loadingLocalMembers, setLoadingLocalMembers] = useState(false)

  // Use context team members if available, otherwise use local
  const teamMembers = contextTeamMembers?.length > 0 ? contextTeamMembers : localTeamMembers
  const isLoadingMembers = teamLoading || loadingLocalMembers

  useEffect(() => {
    const fetchLocalTeamMembers = async () => {
      if (!open || !currentPractice?.id) return
      if (contextTeamMembers && contextTeamMembers.length > 0) return

      setLoadingLocalMembers(true)
      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/team-members`)
        if (response.ok) {
          const data = await response.json()
          const members = Array.isArray(data) ? data : data.teamMembers || data.members || []
          setLocalTeamMembers(members.filter((m: any) => m.id && m.id.trim() !== ""))
        }
      } catch (error) {
        console.error("[v0] Error fetching local team members:", error)
      } finally {
        setLoadingLocalMembers(false)
      }
    }

    fetchLocalTeamMembers()
  }, [open, currentPractice?.id, contextTeamMembers])

  // Initialize form when template changes
  useEffect(() => {
    if (template && open) {
      setWorkflowName(template.title)
      setWorkflowDescription(template.description || "")
      setPriority("medium")
      setError(null)

      // Initialize step assignments from template
      setStepAssignments(
        template.steps.map((step) => ({
          title: step.title,
          assignedUserId: step.assignedUserId,
          assignedTo: step.assignedTo,
          subitems: step.subitems?.map((sub: any) => ({
            title: sub.title,
            assignedUserId: sub.assignedUserId,
            assignedTo: sub.assignedTo,
          })),
        })),
      )
    }
  }, [template, open])

  const updateStepAssignment = (index: number, userId: string | undefined) => {
    const member = userId ? teamMembers.find((m) => m.userId === userId || m.id === userId) : undefined
    setStepAssignments((prev) =>
      prev.map((step, i) =>
        i === index
          ? {
              ...step,
              assignedUserId: userId,
              assignedTo: member?.name,
            }
          : step,
      ),
    )
  }

  const updateSubitemAssignment = (stepIndex: number, subitemIndex: number, userId: string | undefined) => {
    const member = userId ? teamMembers.find((m) => m.userId === userId || m.id === userId) : undefined
    setStepAssignments((prev) =>
      prev.map((step, i) => {
        if (i !== stepIndex || !step.subitems) return step
        return {
          ...step,
          subitems: step.subitems.map((sub, j) =>
            j === subitemIndex
              ? {
                  ...sub,
                  assignedUserId: userId,
                  assignedTo: member?.name,
                }
              : sub,
          ),
        }
      }),
    )
  }

  const toggleStepExpanded = (index: number) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const handleCreate = async () => {
    if (!template) return
    if (!workflowName.trim()) {
      setError("Bitte geben Sie einen Namen für den Workflow ein.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Merge step assignments back into the template steps
      const stepsWithAssignments = template.steps.map((step, index) => ({
        ...step,
        assignedUserId: stepAssignments[index]?.assignedUserId,
        assignedTo: stepAssignments[index]?.assignedTo,
        subitems: step.subitems?.map((sub: any, subIndex: number) => ({
          ...sub,
          assignedUserId: stepAssignments[index]?.subitems?.[subIndex]?.assignedUserId,
          assignedTo: stepAssignments[index]?.subitems?.[subIndex]?.assignedTo,
        })),
      }))

      const result = await createWorkflowFromTemplate(template.id, {
        title: workflowName,
        description: workflowDescription,
        priority,
        createdBy: user?.name || "Current User",
        steps: stepsWithAssignments as any,
      })

      if (result) {
        onSuccess?.(result)
        onOpenChange(false)
      }
    } catch (err) {
      console.error("[v0] Error creating workflow from template:", err)
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen des Workflows")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!template) return null

  const totalSubitems = template.steps.reduce((total, step) => total + (step.subitems?.length || 0), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workflow aus Vorlage erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie einen neuen Workflow basierend auf der Vorlage "{template.title}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {/* Template Info */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{template.title}</h4>
                  {template.description && <p className="text-sm text-muted-foreground mt-1">{template.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {template.hideItemsFromOtherUsers && (
                    <Badge variant="secondary" className="gap-1">
                      <EyeOff className="h-3 w-3" />
                      Eingeschränkte Sicht
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ListChecks className="h-4 w-4" />
                  <span>
                    {template.steps.length} Schritte{totalSubitems > 0 && `, ${totalSubitems} Unterschritte`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{template.estimatedDuration} Min. geschätzt</span>
                </div>
              </div>

              {template.hideItemsFromOtherUsers && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                  <strong>Hinweis:</strong> Benutzer sehen nur die Aufgaben, die ihnen zugewiesen sind.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workflow Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workflow-Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflowName">Workflow-Name *</Label>
                <Input
                  id="workflowName"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Name für diesen Workflow..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workflowDescription">Beschreibung</Label>
                <Textarea
                  id="workflowDescription"
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Optionale Beschreibung..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priorität</Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="urgent">Dringend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Step Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verantwortliche zuweisen</CardTitle>
              <CardDescription>
                Weisen Sie den Schritten verantwortliche Teammitglieder zu.
                {template.hideItemsFromOtherUsers && " Diese Zuweisung bestimmt, wer welche Aufgaben sehen kann."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stepAssignments.map((step, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-sm">{step.title}</span>
                          {step.subitems && step.subitems.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStepExpanded(index)}
                              className="ml-2 h-6 px-2 text-xs"
                            >
                              {expandedSteps.has(index) ? (
                                <ChevronDown className="h-3 w-3 mr-1" />
                              ) : (
                                <ChevronRight className="h-3 w-3 mr-1" />
                              )}
                              {step.subitems.length} Unterschritte
                            </Button>
                          )}
                        </div>
                      </div>
                      <Select
                        value={step.assignedUserId || "unassigned"}
                        onValueChange={(v) => updateStepAssignment(index, v === "unassigned" ? undefined : v)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Verantwortlich..." />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingMembers ? (
                            <SelectItem value="loading">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Lade Teammitglieder...
                            </SelectItem>
                          ) : (
                            <>
                              <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                              {teamMembers.filter(isActiveMember).map((member) => (
                                <SelectItem key={member.id} value={member.userId || member.id}>
                                  <div className="flex items-center gap-2">
                                    <User className="h-3 w-3" />
                                    {member.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Subitems */}
                    {expandedSteps.has(index) && step.subitems && step.subitems.length > 0 && (
                      <div className="mt-3 ml-8 pl-4 border-l-2 border-blue-200 space-y-2">
                        {step.subitems.map((subitem, subIndex) => (
                          <div key={subIndex} className="flex items-center justify-between gap-4 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              </div>
                              <span className="text-sm">{subitem.title}</span>
                            </div>
                            <Select
                              value={subitem.assignedUserId || "unassigned"}
                              onValueChange={(v) =>
                                updateSubitemAssignment(index, subIndex, v === "unassigned" ? undefined : v)
                              }
                            >
                              <SelectTrigger className="w-[180px] h-8 text-sm">
                                <SelectValue placeholder="Verantwortlich..." />
                              </SelectTrigger>
                              <SelectContent>
                                {isLoadingMembers ? (
                                  <SelectItem value="loading">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Lade Teammitglieder...
                                  </SelectItem>
                                ) : (
                                  <>
                                    <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                                    {teamMembers.filter(isActiveMember).map((member) => (
                                      <SelectItem key={member.id} value={member.userId || member.id}>
                                        {member.name}
                                      </SelectItem>
                                    ))}
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? (
              "Wird erstellt..."
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Workflow erstellen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateWorkflowFromTemplateDialog

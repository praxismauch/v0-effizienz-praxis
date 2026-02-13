"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, Clock } from "lucide-react"
import type { TemplateStep, TemplateFormData, OrgaCategory } from "./workflow-template/types"
import { BasicInfoCard } from "./workflow-template/basic-info-card"
import { StepCard } from "./workflow-template/step-card"

interface WorkflowTemplateDialogProps {
  template?: WorkflowTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  onSuccess?: () => void
}

export function WorkflowTemplateDialog({ template, open, onOpenChange, mode, onSuccess }: WorkflowTemplateDialogProps) {
  const { createTemplate, updateTemplate } = useWorkflow()
  const { teamMembers: contextTeamMembers } = useTeam()
  const { currentPractice } = usePractice()

  const [formData, setFormData] = useState<TemplateFormData>({
    title: "",
    description: "",
    category: "",
    isPublic: false,
    hideItemsFromOtherUsers: false,
  })

  const [steps, setSteps] = useState<TemplateStep[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())
  const [orgaCategories, setOrgaCategories] = useState<OrgaCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [localTeamMembers, setLocalTeamMembers] = useState<any[]>([])

  const teamMembers = contextTeamMembers?.length > 0 ? contextTeamMembers : localTeamMembers

  // Fetch local team members fallback
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
      } catch {
        // silently handle
      }
    }
    fetchLocalTeamMembers()
  }, [open, currentPractice?.id, contextTeamMembers])

  // Initialize form data
  useEffect(() => {
    if (template && mode === "edit") {
      setFormData({
        title: template.title,
        description: template.description || "",
        category: template.category,
        isPublic: template.isPublic,
        hideItemsFromOtherUsers: template.hideItemsFromOtherUsers || false,
      })
      setSteps(
        template.steps.map((step) => ({
          title: step.title,
          description: step.description,
          assignedTo: step.assignedTo,
          assignedUserId: step.assignedUserId,
          estimatedDuration: step.estimatedDuration,
          dependencies: step.dependencies,
          subitems: step.subitems || [],
        })),
      )
    } else {
      setFormData({ title: "", description: "", category: "", isPublic: false, hideItemsFromOtherUsers: false })
      setSteps([])
    }
    setErrors({})
    setExpandedSteps(new Set())
  }, [template, mode, open])

  // Fetch categories
  useEffect(() => {
    const fetchOrgaCategories = async () => {
      if (!currentPractice?.id || !open) return
      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/orga-categories`)
        if (response.ok) {
          const data = await response.json()
          setOrgaCategories(data.categories || [])
        }
      } catch {
        // silently handle
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchOrgaCategories()
  }, [currentPractice?.id, open])

  // Step management
  const addStep = () => {
    setSteps([...steps, { title: "", description: "", estimatedDuration: 15, dependencies: [], subitems: [] }])
  }

  const updateStep = (index: number, updates: Partial<TemplateStep>) => {
    setSteps(steps.map((step, i) => (i === index ? { ...step, ...updates } : step)))
  }

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
    setSteps(newSteps.map((step) => ({
      ...step,
      dependencies: step.dependencies.filter((dep) => Number.parseInt(dep) !== index),
    })))
  }

  const moveStep = (index: number, direction: "up" | "down") => {
    const newSteps = [...steps]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex >= 0 && targetIndex < steps.length) {
      ;[newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]
      setSteps(newSteps)
    }
  }

  const toggleStepExpanded = (index: number) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) newSet.delete(index)
      else newSet.add(index)
      return newSet
    })
  }

  // Subitem management
  const addSubitem = (stepIndex: number) => {
    const newSteps = [...steps]
    if (!newSteps[stepIndex].subitems) newSteps[stepIndex].subitems = []
    newSteps[stepIndex].subitems!.push({ title: "", description: "", estimatedDuration: 10, dependencies: [] })
    setSteps(newSteps)
    setExpandedSteps((prev) => new Set([...prev, stepIndex]))
  }

  const updateSubitem = (stepIndex: number, subitemIndex: number, updates: Partial<TemplateStep>) => {
    const newSteps = [...steps]
    if (newSteps[stepIndex].subitems) {
      newSteps[stepIndex].subitems![subitemIndex] = { ...newSteps[stepIndex].subitems![subitemIndex], ...updates }
    }
    setSteps(newSteps)
  }

  const removeSubitem = (stepIndex: number, subitemIndex: number) => {
    const newSteps = [...steps]
    if (newSteps[stepIndex].subitems) {
      newSteps[stepIndex].subitems = newSteps[stepIndex].subitems!.filter((_, i) => i !== subitemIndex)
    }
    setSteps(newSteps)
  }

  // Validation & Save
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = "Titel ist erforderlich"
    if (steps.length === 0) newErrors.steps = "Mindestens ein Schritt ist erforderlich"
    steps.forEach((step, index) => {
      if (!step.title.trim()) newErrors[`step-${index}-title`] = "Schritt-Titel ist erforderlich"
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) return

    const calculateTotalDuration = (items: TemplateStep[]): number =>
      items.reduce((total, s) => total + (s.estimatedDuration || 0) + (s.subitems ? calculateTotalDuration(s.subitems) : 0), 0)

    const templateData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      isPublic: formData.isPublic,
      hideItemsFromOtherUsers: formData.hideItemsFromOtherUsers,
      practiceId: currentPractice?.id,
      steps: steps.map((step) => ({
        title: step.title,
        description: step.description,
        assignedTo: step.assignedTo,
        assignedUserId: step.assignedUserId,
        estimatedDuration: step.estimatedDuration,
        dependencies: step.dependencies,
        subitems: step.subitems || [],
      })),
      estimatedDuration: calculateTotalDuration(steps),
      createdBy: "Current User",
    }

    if (mode === "create") createTemplate(templateData)
    else if (template) updateTemplate(template.id, templateData)

    onOpenChange(false)
    onSuccess?.()
  }

  const totalDuration = steps.reduce((total, step) => {
    const stepDuration = step.estimatedDuration || 0
    const subitemsDuration = step.subitems?.reduce((sub, item) => sub + (item.estimatedDuration || 0), 0) || 0
    return total + stepDuration + subitemsDuration
  }, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Neue Workflow-Vorlage erstellen" : "Workflow-Vorlage bearbeiten"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Erstellen Sie eine wiederverwendbare Vorlage für strukturierte Arbeitsabläufe."
              : "Bearbeiten Sie die Vorlage und ihre Arbeitsschritte."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <BasicInfoCard
            formData={formData}
            onChange={setFormData}
            errors={errors}
            orgaCategories={orgaCategories}
            loadingCategories={loadingCategories}
          />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Arbeitsschritte</CardTitle>
                  <CardDescription>Definieren Sie die Schritte und Unterschritte für diese Vorlage</CardDescription>
                </div>
                <Button onClick={addStep} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Schritt hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {errors.steps && <p className="text-sm text-red-600 mb-4">{errors.steps}</p>}

              <div className="space-y-4">
                {steps.map((step, index) => (
                  <StepCard
                    key={index}
                    step={step}
                    index={index}
                    totalSteps={steps.length}
                    allSteps={steps}
                    teamMembers={teamMembers}
                    errors={errors}
                    isExpanded={expandedSteps.has(index)}
                    onUpdate={(updates) => updateStep(index, updates)}
                    onRemove={() => removeStep(index)}
                    onMoveUp={() => moveStep(index, "up")}
                    onMoveDown={() => moveStep(index, "down")}
                    onToggleExpand={() => toggleStepExpanded(index)}
                    onAddSubitem={() => addSubitem(index)}
                    onUpdateSubitem={(subIndex, updates) => updateSubitem(index, subIndex, updates)}
                    onRemoveSubitem={(subIndex) => removeSubitem(index, subIndex)}
                  />
                ))}

                {steps.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Noch keine Schritte definiert.</p>
                    <Button onClick={addStep} variant="outline" className="mt-2 bg-transparent">
                      <Plus className="mr-2 h-4 w-4" />
                      Ersten Schritt hinzufügen
                    </Button>
                  </div>
                )}
              </div>

              {steps.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{steps.length}</span>
                      <span>Schritte</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">
                        {steps.reduce((total, step) => total + (step.subitems?.length || 0), 0)}
                      </span>
                      <span>Unterschritte</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">{totalDuration}</span>
                      <span>Min. geschätzt</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>{mode === "create" ? "Vorlage erstellen" : "Änderungen speichern"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default WorkflowTemplateDialog

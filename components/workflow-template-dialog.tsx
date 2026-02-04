"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useWorkflow, type WorkflowTemplate } from "@/contexts/workflow-context"
import { useTeam } from "@/contexts/team-context"
import { usePractice } from "@/contexts/practice-context"
import { isActiveMember } from "@/lib/utils/team-member-filter"
import {
  Plus,
  Trash2,
  GripVertical,
  MoreHorizontal,
  Clock,
  User,
  ChevronDown,
  ChevronRight,
  EyeOff,
} from "lucide-react"

interface WorkflowTemplateDialogProps {
  template?: WorkflowTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  onSuccess?: () => void
}

interface TemplateStep {
  title: string
  description?: string
  assignedTo?: string
  assignedUserId?: string // Added user ID assignment
  estimatedDuration?: number
  dependencies: string[]
  subitems?: TemplateStep[] // Added subitems
}

export function WorkflowTemplateDialog({ template, open, onOpenChange, mode, onSuccess }: WorkflowTemplateDialogProps) {
  const { createTemplate, updateTemplate } = useWorkflow()
  const { teamMembers: contextTeamMembers, loading: teamLoading } = useTeam()
  const { currentPractice } = usePractice()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as WorkflowTemplate["category"],
    isPublic: false,
    hideItemsFromOtherUsers: false, // Added visibility control
  })

  const [steps, setSteps] = useState<TemplateStep[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())

  const [orgaCategories, setOrgaCategories] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const [localTeamMembers, setLocalTeamMembers] = useState<any[]>([])
  const [loadingLocalMembers, setLoadingLocalMembers] = useState(false)

  // Use context team members if available, otherwise use local
  const teamMembers = contextTeamMembers?.length > 0 ? contextTeamMembers : localTeamMembers

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

  // Initialize form data when template changes
  useEffect(() => {
    if (template && mode === "edit") {
      setFormData({
        title: template.title,
        description: template.description || "",
        category: template.category,
        isPublic: template.isPublic,
        hideItemsFromOtherUsers: template.hideItemsFromOtherUsers || false, //
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
      // Reset for create mode
      setFormData({
        title: "",
        description: "",
        category: "",
        isPublic: false,
        hideItemsFromOtherUsers: false,
      })
      setSteps([])
    }
    setErrors({})
    setExpandedSteps(new Set())
  }, [template, mode, open])

  useEffect(() => {
    const fetchOrgaCategories = async () => {
      if (!currentPractice?.id || !open) return

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/orga-categories`)
        if (response.ok) {
          const data = await response.json()
          setOrgaCategories(data.categories || [])
        }
      } catch (error) {
        console.error("[v0] Error fetching orga categories:", error)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchOrgaCategories()
  }, [currentPractice?.id, open])

  const addStep = () => {
    setSteps([
      ...steps,
      {
        title: "",
        description: "",
        estimatedDuration: 15,
        dependencies: [],
        subitems: [],
      },
    ])
  }

  const addSubitem = (stepIndex: number) => {
    const newSteps = [...steps]
    if (!newSteps[stepIndex].subitems) {
      newSteps[stepIndex].subitems = []
    }
    newSteps[stepIndex].subitems!.push({
      title: "",
      description: "",
      estimatedDuration: 10,
      dependencies: [],
    })
    setSteps(newSteps)
    setExpandedSteps((prev) => new Set([...prev, stepIndex]))
  }

  const updateStep = (index: number, updates: Partial<TemplateStep>) => {
    setSteps(steps.map((step, i) => (i === index ? { ...step, ...updates } : step)))
  }

  const updateSubitem = (stepIndex: number, subitemIndex: number, updates: Partial<TemplateStep>) => {
    const newSteps = [...steps]
    if (newSteps[stepIndex].subitems) {
      newSteps[stepIndex].subitems![subitemIndex] = {
        ...newSteps[stepIndex].subitems![subitemIndex],
        ...updates,
      }
    }
    setSteps(newSteps)
  }

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
    // Remove dependencies that reference the deleted step
    const updatedSteps = newSteps.map((step) => ({
      ...step,
      dependencies: step.dependencies.filter((dep) => Number.parseInt(dep) !== index),
    }))
    setSteps(updatedSteps)
  }

  const removeSubitem = (stepIndex: number, subitemIndex: number) => {
    const newSteps = [...steps]
    if (newSteps[stepIndex].subitems) {
      newSteps[stepIndex].subitems = newSteps[stepIndex].subitems!.filter((_, i) => i !== subitemIndex)
    }
    setSteps(newSteps)
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
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Titel ist erforderlich"
    }

    if (steps.length === 0) {
      newErrors.steps = "Mindestens ein Schritt ist erforderlich"
    }

    steps.forEach((step, index) => {
      if (!step.title.trim()) {
        newErrors[`step-${index}-title`] = "Schritt-Titel ist erforderlich"
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) return

    const calculateTotalDuration = (steps: TemplateStep[]): number => {
      return steps.reduce((total, step) => {
        const stepDuration = step.estimatedDuration || 0
        const subitemsDuration = step.subitems ? calculateTotalDuration(step.subitems) : 0
        return total + stepDuration + subitemsDuration
      }, 0)
    }

    const estimatedDuration = calculateTotalDuration(steps)

    const templateData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      isPublic: formData.isPublic,
      hideItemsFromOtherUsers: formData.hideItemsFromOtherUsers, //
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
      estimatedDuration,
      createdBy: "Current User",
    }

    if (mode === "create") {
      createTemplate(templateData)
    } else if (template) {
      updateTemplate(template.id, templateData)
    }

    onOpenChange(false)
    onSuccess?.()
  }

  // Helper to get team member by ID
  const getTeamMemberById = (userId: string) => {
    return teamMembers.find((m) => m.userId === userId || m.id === userId)
  }

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
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grundinformationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Vorlagen-Titel eingeben..."
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beschreibung der Vorlage (optional)..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: string) => setFormData({ ...formData, category: value })}
                    disabled={loadingCategories}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={loadingCategories ? "Kategorien werden geladen..." : "Kategorie wählen..."}
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

                <div className="space-y-2">
                  <Label>Sichtbarkeit</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPublic"
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPublic: !!checked })}
                    />
                    <Label htmlFor="isPublic" className="text-sm">
                      Öffentliche Vorlage (für alle Praxen verfügbar)
                    </Label>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="hideItems" className="font-medium">
                        Aufgaben nur für zugewiesene Benutzer sichtbar
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Wenn aktiviert, sehen Benutzer nur die Aufgaben, die ihnen zugewiesen sind. Praxis-Administratoren
                      und Power User sehen weiterhin alle Aufgaben.
                    </p>
                  </div>
                  <Switch
                    id="hideItems"
                    checked={formData.hideItemsFromOtherUsers}
                    onCheckedChange={(checked) => setFormData({ ...formData, hideItemsFromOtherUsers: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
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
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveStep(index, "up")}
                              disabled={index === 0}
                              className="h-6 w-6 p-0"
                            >
                              <GripVertical className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveStep(index, "down")}
                              disabled={index === steps.length - 1}
                              className="h-6 w-6 p-0"
                            >
                              <GripVertical className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor={`step-${index}-title`}>Schritt-Titel *</Label>
                            <Input
                              id={`step-${index}-title`}
                              value={step.title}
                              onChange={(e) => updateStep(index, { title: e.target.value })}
                              placeholder="Schritt-Titel eingeben..."
                              className={errors[`step-${index}-title`] ? "border-red-500" : ""}
                            />
                            {errors[`step-${index}-title`] && (
                              <p className="text-sm text-red-600">{errors[`step-${index}-title`]}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`step-${index}-description`}>Beschreibung</Label>
                            <Textarea
                              id={`step-${index}-description`}
                              value={step.description || ""}
                              onChange={(e) => updateStep(index, { description: e.target.value })}
                              placeholder="Schritt-Beschreibung (optional)..."
                              rows={2}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`step-${index}-assignedTo`}>Zugewiesen an (Verantwortlich)</Label>
                              <Select
                                value={step.assignedUserId || step.assignedTo || "default"}
                                onValueChange={(value) => {
                                  const member = teamMembers.find((m) => m.userId === value || m.id === value)
                                  updateStep(index, {
                                    assignedUserId: value === "default" ? undefined : value,
                                    assignedTo: member?.name || (value === "default" ? undefined : value),
                                  })
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Teammitglied auswählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="default">Nicht zugewiesen</SelectItem>
                                  {teamMembers.filter(isActiveMember).map((member) => (
                                    <SelectItem key={member.id} value={member.userId || member.id}>
                                      <div className="flex items-center gap-2">
                                        <User className="h-3 w-3" />
                                        {member.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`step-${index}-duration`}>Geschätzte Dauer (Min.)</Label>
                              <Input
                                id={`step-${index}-duration`}
                                type="number"
                                min="1"
                                value={step.estimatedDuration || ""}
                                onChange={(e) =>
                                  updateStep(index, {
                                    estimatedDuration: e.target.value ? Number.parseInt(e.target.value) : undefined,
                                  })
                                }
                                placeholder="15"
                              />
                            </div>
                          </div>

                          {/* Dependencies */}
                          {index > 0 && (
                            <div className="space-y-2">
                              <Label>Abhängigkeiten</Label>
                              <div className="space-y-2 max-h-24 overflow-y-auto">
                                {steps.slice(0, index).map((_, depIndex) => (
                                  <div key={depIndex} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`step-${index}-dep-${depIndex}`}
                                      checked={step.dependencies.includes(depIndex.toString())}
                                      onCheckedChange={(checked) => {
                                        const newDeps = checked
                                          ? [...step.dependencies, depIndex.toString()]
                                          : step.dependencies.filter((dep) => dep !== depIndex.toString())
                                        updateStep(index, { dependencies: newDeps })
                                      }}
                                    />
                                    <Label htmlFor={`step-${index}-dep-${depIndex}`} className="text-sm">
                                      Schritt {depIndex + 1}: {steps[depIndex].title || "Unbenannt"}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="border-t pt-3 mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStepExpanded(index)}
                                className="gap-1 p-0 h-auto"
                              >
                                {expandedSteps.has(index) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <span className="text-sm font-medium">
                                  Unterschritte ({step.subitems?.length || 0})
                                </span>
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => addSubitem(index)}>
                                <Plus className="mr-1 h-3 w-3" />
                                Unterschritt
                              </Button>
                            </div>

                            {expandedSteps.has(index) && step.subitems && step.subitems.length > 0 && (
                              <div className="space-y-3 ml-4 pl-4 border-l-2 border-blue-200">
                                {step.subitems.map((subitem, subIndex) => (
                                  <div key={subIndex} className="bg-gray-50 rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium text-muted-foreground">
                                        Unterschritt {subIndex + 1}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeSubitem(index, subIndex)}
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <Input
                                      value={subitem.title}
                                      onChange={(e) => updateSubitem(index, subIndex, { title: e.target.value })}
                                      placeholder="Unterschritt-Titel..."
                                      className="text-sm"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      <Select
                                        value={subitem.assignedUserId || subitem.assignedTo || "default"}
                                        onValueChange={(value) => {
                                          const member = teamMembers.find((m) => m.userId === value || m.id === value)
                                          updateSubitem(index, subIndex, {
                                            assignedUserId: value === "default" ? undefined : value,
                                            assignedTo: member?.name || (value === "default" ? undefined : value),
                                          })
                                        }}
                                      >
                                        <SelectTrigger className="text-sm">
                                          <SelectValue placeholder="Verantwortlich..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="default">Nicht zugewiesen</SelectItem>
                                          {teamMembers.filter(isActiveMember).map((member) => (
                                            <SelectItem key={member.id} value={member.userId || member.id}>
                                              {member.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={subitem.estimatedDuration || ""}
                                        onChange={(e) =>
                                          updateSubitem(index, subIndex, {
                                            estimatedDuration: e.target.value
                                              ? Number.parseInt(e.target.value)
                                              : undefined,
                                          })
                                        }
                                        placeholder="Min."
                                        className="text-sm"
                                      />
                                    </div>
                                  </div>
                                ))}
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
                            <DropdownMenuItem onClick={() => removeStep(index)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Schritt löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
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
                      <span className="font-medium">
                        {steps.reduce((total, step) => {
                          const stepDuration = step.estimatedDuration || 0
                          const subitemsDuration =
                            step.subitems?.reduce((sub, item) => sub + (item.estimatedDuration || 0), 0) || 0
                          return total + stepDuration + subitemsDuration
                        }, 0)}
                      </span>
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

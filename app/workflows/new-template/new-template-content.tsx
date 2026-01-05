"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useWorkflow, type WorkflowTemplate } from "@/contexts/workflow-context"
import { useTeam } from "@/contexts/team-context"
import { usePractice } from "@/contexts/practice-context"
import { Plus, Trash2, GripVertical, MoreHorizontal, Clock, User, ArrowLeft } from "lucide-react"
import type { TemplateStep } from "@/types/template-step"
import { AppLayout } from "@/components/app-layout"

export default function NewTemplateContent() {
  const router = useRouter()
  const { createTemplate } = useWorkflow()
  const { teamMembers } = useTeam()
  const { currentPractice } = usePractice()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "administrative" as WorkflowTemplate["category"],
    isPublic: false,
  })

  const [steps, setSteps] = useState<TemplateStep[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addStep = () => {
    setSteps([
      ...steps,
      {
        title: "",
        description: "",
        estimatedDuration: 15,
        dependencies: [],
      },
    ])
  }

  const updateStep = (index: number, updates: Partial<TemplateStep>) => {
    setSteps(steps.map((step, i) => (i === index ? { ...step, ...updates } : step)))
  }

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
    const updatedSteps = newSteps.map((step) => ({
      ...step,
      dependencies: step.dependencies.filter((dep) => Number.parseInt(dep) !== index),
    }))
    setSteps(updatedSteps)
  }

  const moveStep = (index: number, direction: "up" | "down") => {
    const newSteps = [...steps]
    const targetIndex = direction === "up" ? index - 1 : index + 1

    if (targetIndex >= 0 && targetIndex < steps.length) {
      ;[newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]
      setSteps(newSteps)
    }
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

    const estimatedDuration = steps.reduce((total, step) => total + (step.estimatedDuration || 0), 0)

    const templateData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      isPublic: formData.isPublic,
      practiceId: currentPractice?.id,
      steps: steps.map((step) => ({
        title: step.title,
        description: step.description,
        assignedTo: step.assignedTo,
        estimatedDuration: step.estimatedDuration,
        dependencies: step.dependencies,
      })),
      estimatedDuration,
      createdBy: "Current User",
    }

    createTemplate(templateData)
    router.push("/workflows")
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push("/workflows")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">Neue Workflow-Vorlage</h1>
            </div>
            <p className="text-muted-foreground">
              Erstellen Sie eine wiederverwendbare Vorlage für strukturierte Arbeitsabläufe.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/workflows")}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>Vorlage erstellen</Button>
          </div>
        </div>

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
                  onValueChange={(value: WorkflowTemplate["category"]) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrative">Verwaltung</SelectItem>
                    <SelectItem value="maintenance">Wartung</SelectItem>
                    <SelectItem value="emergency">Notfall</SelectItem>
                    <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sichtbarkeit</Label>
                <div className="flex items-center space-x-2 h-10">
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
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Arbeitsschritte</CardTitle>
                <CardDescription>Definieren Sie die Schritte für diese Vorlage</CardDescription>
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
                            <Label htmlFor={`step-${index}-assignedTo`}>Zugewiesen an</Label>
                            <Select
                              value={step.assignedTo || "default"}
                              onValueChange={(value) => updateStep(index, { assignedTo: value || undefined })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Teammitglied auswählen..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">Nicht zugewiesen</SelectItem>
                                {teamMembers.map((member) => (
                                  <SelectItem key={member.id} value={member.name}>
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
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">
                      {steps.reduce((total, step) => total + (step.estimatedDuration || 0), 0)}
                    </span>
                    <span>Min. geschätzt</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

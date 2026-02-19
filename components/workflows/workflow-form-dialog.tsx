"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X } from "lucide-react"
import { categoryLabels } from "@/app/workflows/workflow-types"

interface WorkflowStep {
  title: string
  description?: string
  assignedTo?: string
  estimatedDuration?: number
  dependencies: string[]
}

interface FormData {
  name: string
  description: string
  category: string
  steps: WorkflowStep[]
  is_active: boolean
  hide_items_from_other_users: boolean
}

interface WorkflowFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  formData: FormData
  onFormChange: (data: FormData) => void
  onSubmit: () => void
  isSaving: boolean
  submitLabel: string
  savingLabel: string
}

const defaultStep: WorkflowStep = {
  title: "",
  description: "",
  assignedTo: "",
  estimatedDuration: 5,
  dependencies: [],
}

export function WorkflowFormDialog({
  open,
  onOpenChange,
  title,
  description,
  formData,
  onFormChange,
  onSubmit,
  isSaving,
  submitLabel,
  savingLabel,
}: WorkflowFormDialogProps) {

  const addStep = () => {
    onFormChange({ ...formData, steps: [...formData.steps, { ...defaultStep }] })
  }

  const removeStep = (index: number) => {
    onFormChange({ ...formData, steps: formData.steps.filter((_, i) => i !== index) })
  }

  const updateStep = (index: number, field: keyof WorkflowStep, value: string | number | string[]) => {
    onFormChange({
      ...formData,
      steps: formData.steps.map((step, i) => (i === index ? { ...step, [field]: value } : step)),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="space-y-4 py-2 pr-4">
            <div className="space-y-2">
              <Label htmlFor="wf-name">Name *</Label>
              <Input
                id="wf-name"
                value={formData.name}
                onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                placeholder="z.B. Patientenaufnahme"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wf-desc">Beschreibung</Label>
              <Textarea
                id="wf-desc"
                value={formData.description}
                onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
                placeholder="Beschreibung des Workflows..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wf-cat">Kategorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => onFormChange({ ...formData, category: value })}
              >
                <SelectTrigger id="wf-cat">
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

            {/* Steps editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Schritte ({formData.steps.length})</Label>
                <Button type="button" variant="outline" size="sm" onClick={addStep}>
                  <Plus className="h-3 w-3 mr-1" />
                  Schritt
                </Button>
              </div>
              {formData.steps.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {"Noch keine Schritte. Klicken Sie auf \"+ Schritt\" oder nutzen Sie die KI-Generierung."}
                </p>
              )}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {formData.steps.map((step, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground font-mono mt-2.5 w-5 shrink-0">{index + 1}.</span>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={step.title}
                          onChange={(e) => updateStep(index, "title", e.target.value)}
                          placeholder="Schritt-Titel"
                          className="text-sm"
                        />
                        <Textarea
                          value={step.description || ""}
                          onChange={(e) => updateStep(index, "description", e.target.value)}
                          placeholder="Beschreibung (optional)"
                          rows={2}
                          className="text-sm resize-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={step.assignedTo || ""}
                            onChange={(e) => updateStep(index, "assignedTo", e.target.value)}
                            placeholder="Zustaendig (z.B. MFA)"
                            className="text-sm"
                          />
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={step.estimatedDuration || ""}
                              onChange={(e) => updateStep(index, "estimatedDuration", parseInt(e.target.value) || 0)}
                              placeholder="Min."
                              className="text-sm"
                              min={0}
                            />
                            <span className="text-xs text-muted-foreground shrink-0">Min.</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(index)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSubmit} disabled={isSaving || !formData.name.trim()}>
            {isSaving ? savingLabel : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

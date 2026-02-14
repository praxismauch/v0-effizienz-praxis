"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sparkles } from "lucide-react"
import { categoryLabels, priorityConfig } from "../workflow-types"
import type { WorkflowFormData } from "../workflow-types"

interface WorkflowFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: WorkflowFormData
  onFormDataChange: (data: WorkflowFormData) => void
  onSubmit: () => void
  isSaving: boolean
  isEdit?: boolean
  isAiEnabled?: boolean
  isGeneratingAI?: boolean
  onGenerateAI?: () => void
}

export function WorkflowFormDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  isSaving,
  isEdit = false,
  isAiEnabled = false,
  isGeneratingAI = false,
  onGenerateAI,
}: WorkflowFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Workflow bearbeiten" : "Neuen Workflow erstellen"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Bearbeiten Sie die Details des Workflows." : "Erstellen Sie einen neuen Arbeitsablauf für Ihre Praxis."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={isEdit ? "edit-name" : "name"}>Name</Label>
            <Input
              id={isEdit ? "edit-name" : "name"}
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              placeholder="z.B. Patientenaufnahme"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={isEdit ? "edit-description" : "description"}>Beschreibung</Label>
            <Textarea
              id={isEdit ? "edit-description" : "description"}
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              placeholder="Beschreiben Sie den Workflow..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={formData.category} onValueChange={(v) => onFormDataChange({ ...formData, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isEdit ? (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: any) => onFormDataChange({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Entwurf</SelectItem>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="archived">Archiviert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Priorität</Label>
                <Select value={formData.priority} onValueChange={(v: any) => onFormDataChange({ ...formData, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {!isEdit && isAiEnabled && onGenerateAI && (
            <Button type="button" variant="outline" onClick={onGenerateAI} disabled={isGeneratingAI} className="w-full bg-transparent">
              <Sparkles className="mr-2 h-4 w-4" />
              {isGeneratingAI ? "Generiere..." : "Mit KI generieren"}
            </Button>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={onSubmit} disabled={isSaving || !formData.name.trim()}>
            {isSaving ? (isEdit ? "Speichere..." : "Erstelle...") : (isEdit ? "Speichern" : "Erstellen")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

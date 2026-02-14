"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Globe } from "lucide-react"
import type { PracticeType } from "./types"

interface TemplateFormData {
  name: string
  description: string
  specialty_ids: string[]
  is_system_template: boolean
}

interface TemplateFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: TemplateFormData
  onFormChange: (data: TemplateFormData) => void
  practiceTypes: PracticeType[]
  onSubmit: () => void
  isSaving: boolean
  mode: "create" | "edit"
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  formData,
  onFormChange,
  practiceTypes,
  onSubmit,
  isSaving,
  mode,
}: TemplateFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Neue Vorlage erstellen" : "Vorlage bearbeiten"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Erstellen Sie eine neue Skill-Vorlage für einen Praxistyp"
              : "Ändern Sie die Eigenschaften der Vorlage"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Name *</Label>
            <Input
              id="template-name"
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              placeholder="z.B. Zahnarztpraxis Standard"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Beschreibung</Label>
            <Textarea
              id="template-description"
              value={formData.description}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
              placeholder="Optionale Beschreibung der Vorlage"
            />
          </div>

          <div className="space-y-2">
            <Label>Praxistypen</Label>
            <Select
              value={formData.specialty_ids[0] || ""}
              onValueChange={(value) => onFormChange({ ...formData, specialty_ids: [value] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Praxistyp auswählen" />
              </SelectTrigger>
              <SelectContent>
                {practiceTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Globe className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <Label htmlFor="system-template-toggle" className="text-sm font-semibold text-amber-900">
                  System-Vorlage
                </Label>
                <p className="text-xs text-amber-700">Für alle Benutzer sichtbar</p>
              </div>
            </div>
            <Switch
              id="system-template-toggle"
              checked={formData.is_system_template}
              onCheckedChange={(checked) => onFormChange({ ...formData, is_system_template: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Erstellen" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

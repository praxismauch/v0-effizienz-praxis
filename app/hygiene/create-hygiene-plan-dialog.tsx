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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Sparkles } from "lucide-react"
import { PLAN_TYPES, AREAS, FREQUENCIES, type HygieneFormData } from "./hygiene-constants"

interface CreateHygienePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: HygieneFormData
  onFormChange: (data: HygieneFormData) => void
  onSubmit: () => void
  onGenerateAI: () => void
  isGenerating: boolean
  editMode?: boolean
}

export function CreateHygienePlanDialog({
  open,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  onGenerateAI,
  isGenerating,
  editMode = false,
}: CreateHygienePlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? "Hygieneplan bearbeiten" : "Neuen Hygieneplan erstellen"}</DialogTitle>
          <DialogDescription>
            {editMode ? "Bearbeiten Sie die Details dieses Hygieneplans" : "Erstellen Sie einen neuen Hygieneplan basierend auf RKI-Empfehlungen"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan_type">Plan-Typ</Label>
              <Select value={formData.plan_type} onValueChange={(value) => onFormChange({ ...formData, plan_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie einen Typ" />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Bereich</Label>
              <Select value={formData.area} onValueChange={(value) => onFormChange({ ...formData, area: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie einen Bereich" />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((area) => (
                    <SelectItem key={area.value} value={area.value}>{area.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.plan_type && formData.area && (
            <Button type="button" variant="outline" className="w-full" onClick={onGenerateAI} disabled={isGenerating}>
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? "Generiere RKI-Empfehlungen..." : "Mit AI und RKI-Richtlinien generieren"}
            </Button>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input id="title" value={formData.title} onChange={(e) => onFormChange({ ...formData, title: e.target.value })} placeholder="z.B. Händedesinfektion vor Behandlung" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => onFormChange({ ...formData, description: e.target.value })} placeholder="Optionale Beschreibung des Hygieneplans" rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Häufigkeit</Label>
            <Select value={formData.frequency} onValueChange={(value) => onFormChange({ ...formData, frequency: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Wählen Sie die Häufigkeit" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="procedure">Durchführung</Label>
            <Textarea id="procedure" value={formData.procedure} onChange={(e) => onFormChange({ ...formData, procedure: e.target.value })} placeholder="Beschreiben Sie die Durchführung Schritt für Schritt" rows={4} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsible_role">Verantwortliche Rolle</Label>
              <Input id="responsible_role" value={formData.responsible_role} onChange={(e) => onFormChange({ ...formData, responsible_role: e.target.value })} placeholder="z.B. Behandler, MFA" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="products_used">Verwendete Produkte</Label>
              <Input id="products_used" value={formData.products_used} onChange={(e) => onFormChange({ ...formData, products_used: e.target.value })} placeholder="Komma-getrennt" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rki_reference">RKI-Referenz</Label>
            <Input id="rki_reference" value={formData.rki_reference} onChange={(e) => onFormChange({ ...formData, rki_reference: e.target.value })} placeholder="Link oder Referenznummer zur RKI-Empfehlung" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={onSubmit} disabled={!formData.title || !formData.procedure}>
            {editMode ? "Speichern" : "Hygieneplan erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Save } from "lucide-react"
import type { SelfAssessment } from "../types"
import { PERMA_DIMENSIONS } from "../types"

interface AssessmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessment: SelfAssessment
  onAssessmentChange: (assessment: SelfAssessment) => void
  onSave: () => void
  isSaving: boolean
}

export default function AssessmentDialog({
  open,
  onOpenChange,
  assessment,
  onAssessmentChange,
  onSave,
  isSaving,
}: AssessmentDialogProps) {
  const handleSliderChange = (dimension: keyof Omit<SelfAssessment, "notes">, value: number[]) => {
    onAssessmentChange({
      ...assessment,
      [dimension]: value[0],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selbsteinschätzung erfassen</DialogTitle>
          <DialogDescription>
            Bewerten Sie Ihr aktuelles Wohlbefinden in den verschiedenen PERMA-V Dimensionen (0-100)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {PERMA_DIMENSIONS.map((dimension) => (
            <div key={dimension.value} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{dimension.label}</Label>
                <span className="text-sm font-medium">
                  {assessment[dimension.value as keyof Omit<SelfAssessment, "notes">]}
                </span>
              </div>
              <Slider
                value={[assessment[dimension.value as keyof Omit<SelfAssessment, "notes">] as number]}
                onValueChange={(value) =>
                  handleSliderChange(dimension.value as keyof Omit<SelfAssessment, "notes">, value)
                }
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          ))}
          <div className="space-y-2">
            <Label>Notizen / Reflexion</Label>
            <Textarea
              value={assessment.notes}
              onChange={(e) => onAssessmentChange({ ...assessment, notes: e.target.value })}
              placeholder="Was hat Sie heute bewegt? Was möchten Sie verbessern?"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Speichern..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

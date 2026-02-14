"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { CheckCircle2 } from "lucide-react"
import type { HygienePlan } from "./hygiene-constants"

interface ExecuteHygieneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: HygienePlan | null
  notes: string
  onNotesChange: (notes: string) => void
  onSubmit: () => void
}

export function ExecuteHygieneDialog({
  open,
  onOpenChange,
  plan,
  notes,
  onNotesChange,
  onSubmit,
}: ExecuteHygieneDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hygienemaßnahme dokumentieren</DialogTitle>
          <DialogDescription>
            Dokumentieren Sie die Durchführung: {plan?.title}
          </DialogDescription>
        </DialogHeader>

        {plan && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Durchführung:</h4>
              <p className="text-sm whitespace-pre-wrap">{plan.procedure}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="execution_notes">Anmerkungen (optional)</Label>
              <Textarea
                id="execution_notes"
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Besondere Vorkommnisse oder Anmerkungen..."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={onSubmit}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Dokumentieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

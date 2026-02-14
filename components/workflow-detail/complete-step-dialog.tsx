"use client"

import { useState, useEffect } from "react"
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

interface CompleteStepDialogProps {
  stepId: string | null
  initialNotes: string
  onComplete: (stepId: string, notes: string) => void
  onClose: () => void
}

export function CompleteStepDialog({ stepId, initialNotes, onComplete, onClose }: CompleteStepDialogProps) {
  const [notes, setNotes] = useState(initialNotes)

  useEffect(() => {
    setNotes(initialNotes)
  }, [initialNotes])

  if (!stepId) return null

  return (
    <Dialog open={!!stepId} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schritt abschließen</DialogTitle>
          <DialogDescription>
            Fügen Sie optional Notizen hinzu und markieren Sie den Schritt als abgeschlossen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="notes">Notizen (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fügen Sie Notizen oder Kommentare hinzu..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={() => onComplete(stepId, notes)}>Als abgeschlossen markieren</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

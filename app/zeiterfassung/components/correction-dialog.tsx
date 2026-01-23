"use client"

import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { TimeBlock } from "../types"

interface CorrectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  correctionBlock: TimeBlock | null
  correctionNewStart: string
  correctionNewEnd: string
  correctionReason: string
  onNewStartChange: (value: string) => void
  onNewEndChange: (value: string) => void
  onReasonChange: (value: string) => void
  onSubmit: () => void
}

export default function CorrectionDialog({
  open,
  onOpenChange,
  correctionBlock,
  correctionNewStart,
  correctionNewEnd,
  correctionReason,
  onNewStartChange,
  onNewEndChange,
  onReasonChange,
  onSubmit,
}: CorrectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Korrektur beantragen</DialogTitle>
          <DialogDescription>Änderungen müssen von der Praxisleitung genehmigt werden</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {correctionBlock && (
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <div>
                <strong>Datum:</strong> {format(parseISO(correctionBlock.date), "d. MMMM yyyy", { locale: de })}
              </div>
              <div>
                <strong>Aktuell:</strong> {format(parseISO(correctionBlock.start_time), "HH:mm")} -{" "}
                {correctionBlock.end_time ? format(parseISO(correctionBlock.end_time), "HH:mm") : "offen"}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Neue Startzeit</Label>
              <Input
                type="time"
                value={correctionNewStart ? format(parseISO(correctionNewStart), "HH:mm") : ""}
                onChange={(e) => onNewStartChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Neue Endzeit</Label>
              <Input
                type="time"
                value={correctionNewEnd ? format(parseISO(correctionNewEnd), "HH:mm") : ""}
                onChange={(e) => onNewEndChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Begründung *</Label>
            <Textarea
              value={correctionReason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Bitte begründen Sie die gewünschte Änderung..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSubmit} disabled={!correctionReason.trim()}>
            <Send className="h-4 w-4 mr-2" />
            Antrag einreichen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

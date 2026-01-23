"use client"

import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { WORK_LOCATIONS, type StampAction } from "../types"

interface StampDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stampAction: StampAction
  selectedLocation: string
  stampComment: string
  onStampCommentChange: (comment: string) => void
  onConfirm: () => void
  isStamping: boolean
}

export default function StampDialog({
  open,
  onOpenChange,
  stampAction,
  selectedLocation,
  stampComment,
  onStampCommentChange,
  onConfirm,
  isStamping,
}: StampDialogProps) {
  const getTitle = () => {
    switch (stampAction) {
      case "start":
        return "Einstempeln"
      case "stop":
        return "Ausstempeln"
      case "pause_start":
        return "Pause beginnen"
      case "pause_end":
        return "Pause beenden"
      default:
        return "Stempeln"
    }
  }

  const getDescription = () => {
    if (stampAction === "start") {
      const location = WORK_LOCATIONS.find((l) => l.value === selectedLocation)
      return `Arbeitszeit starten am ${location?.label || selectedLocation}`
    }
    return "Bestätigen Sie Ihre Buchung"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="text-3xl font-mono font-bold">{format(new Date(), "HH:mm")}</div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kommentar (optional)</Label>
            <Textarea
              value={stampComment}
              onChange={(e) => onStampCommentChange(e.target.value)}
              placeholder="z.B. Hausbesuch bei Patient X, Fortbildung..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isStamping}
            className={cn(
              stampAction === "start" && "bg-green-600 hover:bg-green-700",
              stampAction === "stop" && "bg-red-600 hover:bg-red-700",
            )}
          >
            {isStamping && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Bestätigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

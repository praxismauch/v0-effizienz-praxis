"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Sparkles, Calendar } from "lucide-react"
import { toast } from "sonner"

interface AICalendarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventCreate?: (event: any) => void
}

export function AICalendarDialog({ open, onOpenChange, onEventCreate }: AICalendarDialogProps) {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error("Bitte geben Sie eine Beschreibung ein")
      return
    }

    setIsLoading(true)
    try {
      // Placeholder for AI calendar event creation
      toast.success("Termin wurde erstellt")
      setPrompt("")
      onOpenChange(false)
    } catch (error) {
      toast.error("Fehler beim Erstellen des Termins")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Terminassistent
          </DialogTitle>
          <DialogDescription>
            Beschreiben Sie den Termin in natürlicher Sprache und ich erstelle ihn für Sie.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            placeholder="z.B. 'Nächsten Montag um 10 Uhr Teambesprechung für 1 Stunde' oder 'Jeden Freitag 14 Uhr Praxismeeting'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            disabled={isLoading}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || !prompt.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Termin erstellen
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

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
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AIDisclaimerDialogProps {
  open: boolean
  onAccept: () => void
  onDecline: () => void
}

export function AIDisclaimerDialog({ open, onAccept, onDecline }: AIDisclaimerDialogProps) {
  const [understood, setUnderstood] = useState(false)
  const { toast } = useToast()

  const handleAccept = () => {
    if (!understood) {
      toast({
        title: "Bestätigung erforderlich",
        description: "Bitte bestätigen Sie, dass Sie die Nutzungsbedingungen verstanden haben.",
        variant: "destructive",
      })
      return
    }
    onAccept()
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">KI-Funktionen - Haftungsausschluss</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Wichtige Informationen zur Nutzung von KI-gestützten Funktionen
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  Bitte lesen Sie diese Hinweise sorgfältig durch:
                </p>
                <ul className="space-y-2 text-amber-800 dark:text-amber-200">
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">•</span>
                    <span>
                      <strong>Keine medizinische oder rechtliche Beratung:</strong> Die KI-generierten Inhalte dienen
                      ausschließlich zu Informationszwecken und stellen keine medizinische, rechtliche oder
                      professionelle Beratung dar.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">•</span>
                    <span>
                      <strong>Sorgfaltspflicht:</strong> Alle von der KI bereitgestellten Informationen und Empfehlungen
                      müssen von qualifiziertem Fachpersonal überprüft werden, bevor sie angewendet werden.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">•</span>
                    <span>
                      <strong>Mögliche Fehler:</strong> KI-Systeme können Fehler machen oder ungenaue Informationen
                      liefern. Verlassen Sie sich nicht ausschließlich auf KI-generierte Inhalte.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">•</span>
                    <span>
                      <strong>Keine Haftung:</strong> Der Anbieter übernimmt keine Haftung für Schäden, die durch die
                      Nutzung der KI-Funktionen entstehen. Die Verwendung erfolgt auf eigenes Risiko.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">•</span>
                    <span>
                      <strong>Datenschutz:</strong> Ihre Eingaben werden zur Verarbeitung an KI-Dienste übermittelt.
                      Geben Sie keine sensiblen oder vertraulichen Patientendaten ein.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Durch die Nutzung der KI-Funktionen bestätigen Sie, dass Sie diese Hinweise gelesen und verstanden haben
              und die Verantwortung für die Überprüfung und sachgerechte Anwendung der bereitgestellten Informationen
              übernehmen.
            </p>
          </div>

          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              id="understand"
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked as boolean)}
            />
            <label htmlFor="understand" className="text-sm font-medium leading-none cursor-pointer">
              Ich habe die Nutzungsbedingungen und den Haftungsausschluss gelesen und verstanden. Ich akzeptiere, dass
              KI-generierte Inhalte mit Sorgfalt verwendet werden müssen.
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onDecline}>
            Ablehnen
          </Button>
          <Button onClick={handleAccept} disabled={!understood}>
            Akzeptieren und fortfahren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AIDisclaimerDialog

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Sparkles, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TicketAiActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  actionText: string
  isLoading: boolean
}

export function TicketAiActionDialog({ open, onOpenChange, actionText, isLoading }: TicketAiActionDialogProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(actionText)
      setCopied(true)
      toast({ title: "Kopiert", description: "v0 Anweisung in die Zwischenablage kopiert" })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: "Fehler", description: "Kopieren fehlgeschlagen", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            v0 Entwicklungsanweisung
          </DialogTitle>
          <DialogDescription>
            Diese Anweisung wurde automatisch generiert und kann direkt in den v0 Chat kopiert werden.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">KI generiert Anweisung...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 border rounded-lg p-4 max-h-[400px] overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground">{actionText}</pre>
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Kopieren Sie den Text und fugen Sie ihn in den v0 Chat ein, um das Problem automatisch losen zu lassen.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Schließen</Button>
          <Button onClick={handleCopy} disabled={!actionText} className="gap-2">
            {copied ? <><Check className="h-4 w-4" />Kopiert</> : <><Copy className="h-4 w-4" />In Zwischenablage kopieren</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

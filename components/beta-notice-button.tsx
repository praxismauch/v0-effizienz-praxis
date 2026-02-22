"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Construction,
  CheckCircle2,
  AlertCircle,
  MessageSquareHeart,
  Bug,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BetaNoticeButtonProps {
  sidebarOpen: boolean
}

export function BetaNoticeButton({ sidebarOpen }: BetaNoticeButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="px-3 py-1">
        {sidebarOpen ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="w-full justify-start gap-2 h-8 border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/50"
          >
            <Construction className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs font-medium truncate">Beta-Hinweis</span>
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpen(true)}
                className="w-full h-8 border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/50"
              >
                <Construction className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Beta-Hinweis</TooltipContent>
          </Tooltip>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Construction className="h-5 w-5 text-amber-500" />
              Wichtiger Hinweis
            </DialogTitle>
            <DialogDescription>Informationen zum aktuellen Entwicklungsstand</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="rounded-lg border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 p-3">
              <h4 className="font-medium text-amber-900 dark:text-amber-200 text-sm mb-1">Aktive Entwicklungsphase</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Effizienz Praxis befindet sich in der aktiven Entwicklung (Beta-Phase). Neue Funktionen kommen laufend hinzu und bestehende Features werden stetig verbessert.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex items-start gap-2 rounded-lg border bg-muted/20 p-2.5">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                <span className="text-xs text-muted-foreground">Kernfunktionen voll nutzbar und produktiv</span>
              </div>
              <div className="flex items-start gap-2 rounded-lg border bg-muted/20 p-2.5">
                <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                <span className="text-xs text-muted-foreground">Einige Features in Optimierung</span>
              </div>
              <div className="flex items-start gap-2 rounded-lg border bg-muted/20 p-2.5">
                <Construction className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                <span className="text-xs text-muted-foreground">Neue Module kommen in den nächsten Wochen</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-start gap-2.5">
                  <MessageSquareHeart className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm mb-0.5">Ihr Feedback ist uns wichtig!</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Teilen Sie uns Ihre Erfahrungen, Verbesserungsvorschläge und Fehlermeldungen mit.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-start gap-2.5">
                  <Bug className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm mb-0.5">So geben Sie Feedback</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {"Klicken Sie auf das "}
                      <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
                        <Bug className="h-3 w-3" /> Bug-Icon
                      </span>
                      {" oben rechts neben Ihrem Profil."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-1">
              Vielen Dank, dass Sie Teil dieser Entwicklungsphase sind!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

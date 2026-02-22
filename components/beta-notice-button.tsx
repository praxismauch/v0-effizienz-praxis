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
      <div className="border-b border-sidebar-border px-3 py-3">
        {sidebarOpen ? (
          <button
            onClick={() => setOpen(true)}
            className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-orange-500/20 border border-amber-500/30 px-3 py-2.5 text-left transition-all duration-300 hover:from-amber-500/30 hover:via-amber-400/25 hover:to-orange-500/30 hover:border-amber-400/50 hover:shadow-md hover:shadow-amber-500/10"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 to-orange-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                <Construction className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-amber-300 group-hover:text-amber-200 transition-colors truncate">
                  Wichtiger Hinweis
                </span>
                <span className="text-[10px] text-amber-500/70 leading-tight">Beta-Phase aktiv</span>
              </div>
            </div>
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setOpen(true)}
                className="group flex w-full items-center justify-center rounded-lg bg-gradient-to-b from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-2 transition-all duration-300 hover:from-amber-500/30 hover:to-orange-500/30 hover:border-amber-400/50 hover:shadow-md hover:shadow-amber-500/10"
              >
                <Construction className="h-4 w-4 text-amber-400 group-hover:text-amber-300 transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Wichtiger Hinweis</TooltipContent>
          </Tooltip>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Construction className="h-5 w-5 text-amber-500" />
              Wichtiger Hinweis
            </DialogTitle>
            <DialogDescription>Informationen zum aktuellen Entwicklungsstand</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="rounded-lg border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 p-4">
              <h4 className="font-medium text-amber-900 dark:text-amber-200 mb-2">Aktive Entwicklungsphase</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Effizienz Praxis befindet sich derzeit noch in der aktiven Entwicklung (Beta-Phase). Das bedeutet, dass
                neue Funktionen laufend hinzukommen, bestehende Features verbessert werden und es vereinzelt zu kleineren
                Fehlern oder unerwarteten Verhaltensweisen kommen kann.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Was bedeutet das konkret?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                  <span>Alle Kernfunktionen sind voll nutzbar und werden produktiv eingesetzt</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                  <span>Einige Features sind noch in der Optimierung und werden stetig verbessert</span>
                </li>
                <li className="flex items-start gap-2">
                  <Construction className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                  <span>Neue Module und Funktionen werden in den kommenden Wochen ausgerollt</span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquareHeart className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Ihr Feedback ist uns wichtig!</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Wir laden Sie herzlich ein, uns Ihre Erfahrungen, Verbesserungsvorschlaege und Fehlermeldungen
                    mitzuteilen. Ihr Feedback hilft uns, Effizienz Praxis noch besser zu machen.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Bug className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">So geben Sie Feedback</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {"Klicken Sie auf das "}
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <Bug className="h-3.5 w-3.5" /> Bug-Icon
                    </span>
                    {" in der oberen rechten Ecke der Anwendung (neben Ihrem Profil). "}
                    Dort können Sie Fehler melden, Verbesserungsvorschläge einreichen oder allgemeines Feedback geben
                    -- gerne auch mit Screenshots.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Vielen Dank, dass Sie Teil dieser Entwicklungsphase sind!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

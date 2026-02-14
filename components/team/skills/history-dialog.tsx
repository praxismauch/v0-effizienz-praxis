"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, History, User } from "lucide-react"
import type { SkillHistoryEntry } from "./types"
import { LEVEL_CONFIG } from "./types"

interface HistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  loading: boolean
  history: SkillHistoryEntry[]
}

export function HistoryDialog({ open, onOpenChange, title, loading, history }: HistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>Zeigt alle Änderungen an den Skill-Bewertungen</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Keine Änderungen vorhanden</div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => {
                const levelConfig = LEVEL_CONFIG[entry.level ?? 0]
                const skillName = entry.skill_definitions?.name || "Unbekannter Skill"
                const date = new Date(entry.changed_at)

                return (
                  <div key={entry.id} className="relative pl-6 pb-4">
                    {/* Timeline line */}
                    {index < history.length - 1 && (
                      <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-gray-200" />
                    )}

                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-1 w-[18px] h-[18px] rounded-full ${levelConfig.dotColor}`} />

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{skillName}</span>
                          <Badge variant="outline" className="text-xs">
                            v{entry.version || 1}
                          </Badge>
                          <Badge className={`${levelConfig.color} border text-xs`}>
                            {levelConfig.icon} {levelConfig.title}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {date.toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {entry.change_reason && (
                        <p className="text-sm text-muted-foreground mb-1">
                          <span className="font-medium">Grund:</span> {entry.change_reason}
                        </p>
                      )}

                      {entry.notes && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Notizen:</span> {entry.notes}
                        </p>
                      )}

                      {entry.assessed_by && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Bewertet von: {entry.assessed_by}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

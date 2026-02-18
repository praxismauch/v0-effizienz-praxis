"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RefreshCw, Trash2, History, ChevronRight } from "lucide-react"
import { type ScreenshotRun, formatDate, formatDuration, statusBadgeVariant } from "../screenshot-types"

interface ScreenshotRunHistoryProps {
  runs: ScreenshotRun[]
  loadingRuns: boolean
  activeRunId: string | null
  onLoadRuns: () => void
  onLoadRunDetail: (runId: string) => void
  onDeleteRun: (runId: string) => void
}

export function ScreenshotRunHistory({
  runs,
  loadingRuns,
  activeRunId,
  onLoadRuns,
  onLoadRunDetail,
  onDeleteRun,
}: ScreenshotRunHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Verlauf
            </CardTitle>
            <CardDescription>{runs.length} gespeicherte Läufe</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onLoadRuns} disabled={loadingRuns}>
            <RefreshCw className={`h-4 w-4 ${loadingRuns ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loadingRuns && runs.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Lade Verlauf...
          </div>
        ) : runs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Noch keine Läufe gespeichert
          </p>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {runs.map((run) => (
                <div
                  key={run.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onLoadRunDetail(run.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onLoadRunDetail(run.id)
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent cursor-pointer ${
                    activeRunId === run.id ? "border-primary bg-accent" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {formatDate(run.started_at)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={statusBadgeVariant(run.status)} className="text-xs">
                        {run.status === "completed"
                          ? "Fertig"
                          : run.status === "running"
                            ? "Laufend"
                            : run.status === "failed"
                              ? "Fehler"
                              : run.status}
                      </Badge>
                      <button
                        type="button"
                        title="Lauf löschen"
                        className="p-1 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteRun(run.id)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {run.completed_count}/{run.total_pages} OK
                      {run.failed_count > 0 && (
                        <span className="text-red-500 ml-1">
                          ({run.failed_count} Fehler)
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      <span>{formatDuration(run.started_at, run.finished_at)}</span>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    {run.viewports.map((v) => (
                      <Badge key={v} variant="outline" className="text-[10px] py-0 px-1.5">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

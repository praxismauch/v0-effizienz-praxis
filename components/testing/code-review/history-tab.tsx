"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Code2,
  Loader2,
  RefreshCw,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import type { HistoryEntry } from "./types"

interface HistoryTabProps {
  historyData: HistoryEntry[]
  isLoading: boolean
  onRefresh: () => void
}

export function HistoryTab({ historyData, isLoading, onRefresh }: HistoryTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Code Review Historie
              </CardTitle>
              <CardDescription>Vergangene Code Reviews und deren Ergebnisse</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Aktualisieren
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Lade Historie...</span>
            </div>
          )}
          {!isLoading && historyData.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Noch keine Code Reviews durchgefuehrt. Starten Sie den ersten Scan im Review-Tab.
            </div>
          )}
          {!isLoading && historyData.length > 0 && (
            <>
              {/* Trend Cards */}
              {historyData.length >= 2 && (
                <TrendCards historyData={historyData} />
              )}

              {/* History List */}
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {historyData.map((entry, idx) => {
                    const prevEntry = idx < historyData.length - 1 ? historyData[idx + 1] : null
                    const findingsDiff = prevEntry ? entry.total - prevEntry.total : 0
                    const time = new Date(entry.created_at).toLocaleString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })

                    return (
                      <Card key={entry.id} className="border">
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <Code2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">Code Review</p>
                                <span className="text-xs text-muted-foreground">{time}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span>{entry.total} Findings</span>
                                {entry.errors > 0 && <span className="text-red-600">{entry.errors} kritisch</span>}
                                {entry.warnings > 0 && <span className="text-yellow-600">{entry.warnings} Warn.</span>}
                                {entry.duration_ms != null && (
                                  <span>{entry.duration_ms < 1000 ? `${entry.duration_ms}ms` : `${(entry.duration_ms / 1000).toFixed(1)}s`}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {prevEntry && findingsDiff !== 0 && (
                              <div className={`flex items-center gap-1 text-xs ${findingsDiff < 0 ? "text-green-600" : "text-red-600"}`}>
                                {findingsDiff < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                                {findingsDiff > 0 ? `+${findingsDiff}` : findingsDiff}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TrendCards({ historyData }: { historyData: HistoryEntry[] }) {
  const latest = historyData[0]
  const previous = historyData[1]
  const errorDiff = latest.errors - previous.errors
  const warningDiff = latest.warnings - previous.warnings

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Findings Trend</p>
              <p className="text-xl font-bold">{latest.total}</p>
            </div>
            <div className={`flex items-center gap-1 text-sm ${latest.total < previous.total ? "text-green-600" : latest.total > previous.total ? "text-red-600" : "text-muted-foreground"}`}>
              {latest.total < previous.total ? <TrendingDown className="h-4 w-4" /> : latest.total > previous.total ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              {latest.total - previous.total > 0 ? `+${latest.total - previous.total}` : latest.total - previous.total}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-yellow-200">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Warnungen</p>
              <p className="text-xl font-bold text-yellow-600">{latest.warnings}</p>
            </div>
            <div className={`flex items-center gap-1 text-sm ${warningDiff < 0 ? "text-green-600" : warningDiff > 0 ? "text-red-600" : "text-muted-foreground"}`}>
              {warningDiff < 0 ? <TrendingDown className="h-4 w-4" /> : warningDiff > 0 ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              {warningDiff > 0 ? `+${warningDiff}` : warningDiff === 0 ? "0" : warningDiff}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-red-200">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Kritisch</p>
              <p className="text-xl font-bold text-red-600">{latest.errors}</p>
            </div>
            <div className={`flex items-center gap-1 text-sm ${errorDiff < 0 ? "text-green-600" : errorDiff > 0 ? "text-red-600" : "text-muted-foreground"}`}>
              {errorDiff < 0 ? <TrendingDown className="h-4 w-4" /> : errorDiff > 0 ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              {errorDiff > 0 ? `+${errorDiff}` : errorDiff === 0 ? "0" : errorDiff}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

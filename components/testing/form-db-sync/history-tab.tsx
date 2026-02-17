"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Database,
  History,
  Search,
  Clock,
  Loader2,
  RefreshCw,
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
  const [historyTypeFilter, setHistoryTypeFilter] = useState("all")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Scan-Historie
              </CardTitle>
              <CardDescription>
                Verlauf aller DB-Schema Checks und Form-Scans mit Trend-Analyse
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={historyTypeFilter} onValueChange={setHistoryTypeFilter}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <SelectValue placeholder="Scan-Typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Scan-Typen</SelectItem>
                  <SelectItem value="db-schema">
                    <span className="flex items-center gap-2">
                      <Database className="h-3.5 w-3.5" />
                      DB-Schema Check
                    </span>
                  </SelectItem>
                  <SelectItem value="form-scan">
                    <span className="flex items-center gap-2">
                      <Search className="h-3.5 w-3.5" />
                      Form-Scan
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && historyData.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Lade Historie...</span>
            </div>
          ) : historyData.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <History className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>Noch keine Scan-Ergebnisse vorhanden.</p>
              <p className="text-xs mt-1">Fuehre einen DB-Schema Check oder Form-Scan aus, um die Historie zu starten.</p>
            </div>
          ) : (
            <>
              {/* Trend Summary Cards */}
              {(() => {
                const filtered = historyTypeFilter === "all"
                  ? historyData
                  : historyData.filter((h) => h.scan_type === historyTypeFilter)

                if (filtered.length < 2) return null

                const latest = filtered[0]
                const previous = filtered[1]
                const errorDiff = latest.errors - previous.errors
                const warningDiff = latest.warnings - previous.warnings
                const okDiff = latest.ok - previous.ok

                return (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card className="border-green-200">
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">OK Trend</p>
                            <p className="text-xl font-bold text-green-600">{latest.ok}</p>
                          </div>
                          <TrendIndicator diff={okDiff} invertColor />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-yellow-200">
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Warnungen Trend</p>
                            <p className="text-xl font-bold text-yellow-600">{latest.warnings}</p>
                          </div>
                          <TrendIndicator diff={warningDiff} />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-red-200">
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Fehler Trend</p>
                            <p className="text-xl font-bold text-red-600">{latest.errors}</p>
                          </div>
                          <TrendIndicator diff={errorDiff} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })()}

              {/* History List */}
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {(() => {
                    const filtered = historyTypeFilter === "all"
                      ? historyData
                      : historyData.filter((h) => h.scan_type === historyTypeFilter)

                    if (filtered.length === 0) {
                      return (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                          Keine Einträge für diesen Filter.
                        </div>
                      )
                    }

                    // Group by date
                    const byDate = new Map<string, HistoryEntry[]>()
                    filtered.forEach((entry) => {
                      const date = new Date(entry.created_at).toLocaleDateString("de-DE", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                      if (!byDate.has(date)) byDate.set(date, [])
                      byDate.get(date)!.push(entry)
                    })

                    return Array.from(byDate.entries()).map(([date, entries]) => (
                      <div key={date} className="space-y-2">
                        <div className="flex items-center gap-2 pt-3 pb-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold text-muted-foreground">{date}</span>
                          <Badge variant="secondary" className="text-xs">{entries.length}</Badge>
                        </div>
                        {entries.map((entry, idx) => {
                          const prevEntry = idx < entries.length - 1 ? entries[idx + 1] : null
                          const errorChange = prevEntry ? entry.errors - prevEntry.errors : 0
                          const time = new Date(entry.created_at).toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                          const successRate = entry.total > 0 ? ((entry.ok / entry.total) * 100).toFixed(0) : "0"

                          return (
                            <Card key={entry.id} className="border">
                              <div className="flex items-center justify-between p-3">
                                <div className="flex items-center gap-3">
                                  {entry.scan_type === "db-schema" ? (
                                    <Database className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium">
                                        {entry.scan_type === "db-schema" ? "DB-Schema Check" : "Form-Scan"}
                                      </p>
                                      <span className="text-xs text-muted-foreground font-mono">{time}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                      <span>{entry.total} gesamt</span>
                                      <span className="text-green-600">{entry.ok} OK</span>
                                      {entry.warnings > 0 && <span className="text-yellow-600">{entry.warnings} Warn.</span>}
                                      {entry.errors > 0 && <span className="text-red-600">{entry.errors} Fehler</span>}
                                      {entry.duration_ms != null && (
                                        <span>{entry.duration_ms < 1000 ? `${entry.duration_ms}ms` : `${(entry.duration_ms / 1000).toFixed(1)}s`}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {prevEntry && errorChange !== 0 && (
                                    <div className={`flex items-center gap-1 text-xs ${errorChange < 0 ? "text-green-600" : "text-red-600"}`}>
                                      {errorChange < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                                      {errorChange > 0 ? `+${errorChange}` : errorChange} Fehler
                                    </div>
                                  )}
                                  <div className="text-right">
                                    <span className="text-sm font-bold">{successRate}%</span>
                                    <Progress value={Number(successRate)} className="w-16 h-1.5 mt-0.5" />
                                  </div>
                                </div>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    ))
                  })()}
                </div>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TrendIndicator({ diff, invertColor }: { diff: number; invertColor?: boolean }) {
  const posColor = invertColor ? "text-green-600" : "text-red-600"
  const negColor = invertColor ? "text-red-600" : "text-green-600"
  const color = diff > 0 ? posColor : diff < 0 ? negColor : "text-muted-foreground"
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus
  return (
    <div className={`flex items-center gap-1 text-sm ${color}`}>
      <Icon className="h-4 w-4" />
      {diff > 0 ? `+${diff}` : diff === 0 ? "0" : diff}
    </div>
  )
}

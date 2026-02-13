"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  History,
  Loader2,
  RefreshCw,
  Database,
  Search,
  Code2,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"

export interface HistoryEntry {
  id: string
  scan_type: string
  summary: any
  total: number
  ok: number
  warnings: number
  errors: number
  duration_ms: number | null
  created_at: string
}

interface ScanHistoryTabProps {
  historyData: HistoryEntry[]
  isLoading: boolean
  onRefresh: () => void
  /** Optional type filter for form-db-sync panel which has multiple scan types */
  typeFilter?: string
  onTypeFilterChange?: (value: string) => void
  title?: string
  description?: string
  emptyMessage?: string
}

const SCAN_TYPE_ICONS: Record<string, React.ReactNode> = {
  "db-schema": <Database className="h-4 w-4 text-muted-foreground" />,
  "form-scan": <Search className="h-4 w-4 text-muted-foreground" />,
  "code-review": <Code2 className="h-4 w-4 text-muted-foreground" />,
}

const SCAN_TYPE_LABELS: Record<string, string> = {
  "db-schema": "DB-Schema Check",
  "form-scan": "Form-Scan",
  "code-review": "Code Review",
}

export function ScanHistoryTab({
  historyData,
  isLoading,
  onRefresh,
  typeFilter,
  onTypeFilterChange,
  title = "Scan-Historie",
  description = "Verlauf aller Scans mit Trend-Analyse",
  emptyMessage = "Noch keine Scans durchgefuehrt.",
}: ScanHistoryTabProps) {
  const filteredHistory = typeFilter && typeFilter !== "all"
    ? historyData.filter((e) => e.scan_type === typeFilter)
    : historyData

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {typeFilter !== undefined && onTypeFilterChange && (
                <Select value={typeFilter} onValueChange={onTypeFilterChange}>
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
              )}
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Aktualisieren
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Lade Historie...</span>
            </div>
          )}
          {!isLoading && filteredHistory.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">{emptyMessage}</div>
          )}
          {!isLoading && filteredHistory.length > 0 && (
            <>
              {/* Trend Cards */}
              {filteredHistory.length >= 2 && (
                <TrendCards latest={filteredHistory[0]} previous={filteredHistory[1]} />
              )}

              {/* History List */}
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {filteredHistory.map((entry, idx) => {
                    const prevEntry = idx < filteredHistory.length - 1 ? filteredHistory[idx + 1] : null
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
                            {SCAN_TYPE_ICONS[entry.scan_type] || <Clock className="h-4 w-4 text-muted-foreground" />}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{SCAN_TYPE_LABELS[entry.scan_type] || entry.scan_type}</p>
                                <span className="text-xs text-muted-foreground">{time}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span>{entry.total} {entry.scan_type === "code-review" ? "Findings" : "Tabellen"}</span>
                                <span className="text-green-600">{entry.ok} OK</span>
                                {entry.warnings > 0 && <span className="text-yellow-600">{entry.warnings} Warn.</span>}
                                {entry.errors > 0 && <span className="text-red-600">{entry.errors} {entry.scan_type === "code-review" ? "kritisch" : "Fehler"}</span>}
                                {entry.duration_ms != null && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {entry.duration_ms < 1000 ? `${entry.duration_ms}ms` : `${(entry.duration_ms / 1000).toFixed(1)}s`}
                                  </span>
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

function TrendCards({ latest, previous }: { latest: HistoryEntry; previous: HistoryEntry }) {
  const totalDiff = latest.total - previous.total
  const warningDiff = latest.warnings - previous.warnings
  const errorDiff = latest.errors - previous.errors

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Gesamt Trend</p>
              <p className="text-xl font-bold">{latest.total}</p>
            </div>
            <TrendIndicator diff={totalDiff} />
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
            <TrendIndicator diff={warningDiff} />
          </div>
        </CardContent>
      </Card>
      <Card className="border-red-200">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Fehler / Kritisch</p>
              <p className="text-xl font-bold text-red-600">{latest.errors}</p>
            </div>
            <TrendIndicator diff={errorDiff} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TrendIndicator({ diff }: { diff: number }) {
  const color = diff < 0 ? "text-green-600" : diff > 0 ? "text-red-600" : "text-muted-foreground"
  const Icon = diff < 0 ? TrendingDown : diff > 0 ? TrendingUp : Minus
  return (
    <div className={`flex items-center gap-1 text-sm ${color}`}>
      <Icon className="h-4 w-4" />
      {diff > 0 ? `+${diff}` : diff === 0 ? "0" : diff}
    </div>
  )
}

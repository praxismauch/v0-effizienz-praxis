"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, TrendingUp, TrendingDown, Calendar, Clock, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import type { TimeBalance, PlausibilityIssue } from "../types"

interface ZeitkontoTabProps {
  timeBalance: TimeBalance | null
  plausibilityIssues: PlausibilityIssue[]
  isLoadingBalance: boolean
  isLoadingIssues: boolean
  onResolveIssue: (issue: PlausibilityIssue) => void
}

export default function ZeitkontoTab({
  timeBalance,
  plausibilityIssues,
  isLoadingBalance,
  isLoadingIssues,
  onResolveIssue,
}: ZeitkontoTabProps) {
  const formatHours = (hours: number) => {
    const h = Math.floor(Math.abs(hours))
    const m = Math.round((Math.abs(hours) - h) * 60)
    const sign = hours < 0 ? "-" : "+"
    return `${sign}${h}h ${m}m`
  }

  if (isLoadingBalance) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktueller Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {(timeBalance?.current_balance || 0) >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span
                className={`text-2xl font-bold ${(timeBalance?.current_balance || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatHours(timeBalance?.current_balance || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Soll-Stunden (Monat)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{timeBalance?.target_hours || 0}h</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ist-Stunden (Monat)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{timeBalance?.actual_hours || 0}h</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plausibility Issues */}
      {plausibilityIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Plausibilitätsprüfungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingIssues ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {plausibilityIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800"
                  >
                    <div>
                      <p className="font-medium">{issue.issue_type}</p>
                      <p className="text-sm text-muted-foreground">{issue.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(issue.date), "dd.MM.yyyy", { locale: de })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={issue.severity === "high" ? "destructive" : "secondary"}>
                        {issue.severity === "high" ? "Hoch" : issue.severity === "medium" ? "Mittel" : "Niedrig"}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => onResolveIssue(issue)}>
                        Beheben
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {plausibilityIssues.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-medium text-lg">Alles in Ordnung</h3>
            <p className="text-muted-foreground text-center mt-1">
              Keine Plausibilitätsprobleme gefunden
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

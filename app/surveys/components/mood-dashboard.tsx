"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Plus, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MoodTrendData, MoodAlert } from "../types"

interface MoodDashboardProps {
  isLoading: boolean
  moodTrendData: MoodTrendData[]
  moodAlerts: MoodAlert[]
  selectedPeriod: "4weeks" | "8weeks" | "12weeks"
  onPeriodChange: (period: "4weeks" | "8weeks" | "12weeks") => void
  onCreateMoodSurvey: () => void
  isCreating: boolean
}

export function MoodDashboard({
  isLoading,
  moodTrendData,
  moodAlerts,
  selectedPeriod,
  onPeriodChange,
  onCreateMoodSurvey,
  isCreating,
}: MoodDashboardProps) {
  return (
    <Card className="mb-6 border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/30 dark:to-fuchsia-950/30">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-rose-500" />
              Team Stimmungsbarometer
            </CardTitle>
            <CardDescription>Trends und Fruhwarnsystem fur Team-Wohlbefinden</CardDescription>
          </div>
          <Select value={selectedPeriod} onValueChange={(v: "4weeks" | "8weeks" | "12weeks") => onPeriodChange(v)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4weeks">4 Wochen</SelectItem>
              <SelectItem value="8weeks">8 Wochen</SelectItem>
              <SelectItem value="12weeks">12 Wochen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
          </div>
        ) : moodTrendData.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">Noch keine Stimmungsdaten vorhanden</p>
            <Button onClick={onCreateMoodSurvey} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              Erste Stimmungsumfrage erstellen
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {moodAlerts.length > 0 && (
              <div className="space-y-2">
                {moodAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      alert.type === "critical"
                        ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                        : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
                    )}
                  >
                    <TrendingDown
                      className={cn("h-5 w-5", alert.type === "critical" ? "text-red-600" : "text-amber-600")}
                    />
                    <div className="flex-1">
                      <p
                        className={cn(
                          "font-medium text-sm",
                          alert.type === "critical" ? "text-red-700" : "text-amber-700",
                        )}
                      >
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground">{alert.date}</p>
                    </div>
                    <Badge variant={alert.type === "critical" ? "destructive" : "outline"}>
                      {alert.value.toFixed(1)}/5
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

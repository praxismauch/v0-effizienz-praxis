"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Award, Activity, Meh, ChevronRight, PartyPopper } from "lucide-react"
import type { MoodResponse, WorkloadAnalysis, Kudos } from "../types"
import { KUDOS_CATEGORIES, MOOD_DIMENSIONS, getMoodColor, getBurnoutRiskColor } from "../types"

interface OverviewTabProps {
  moodTrends: any[]
  moodAverages: MoodResponse | null
  kudosList: Kudos[]
  workloadAnalysis: WorkloadAnalysis | null
  onStartFirstSurvey: () => void
  onShowKudosDialog: () => void
  onSwitchToKudosTab: () => void
}

export function OverviewTab({
  moodTrends, moodAverages, kudosList, workloadAnalysis,
  onStartFirstSurvey, onShowKudosDialog, onSwitchToKudosTab,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Mood Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Stimmungs-Trends
            </CardTitle>
            <CardDescription>Entwicklung der Team-Stimmung über Zeit</CardDescription>
          </CardHeader>
          <CardContent>
            {moodTrends.length > 0 ? (
              <div className="space-y-4">
                {MOOD_DIMENSIONS.map(({ key, label }) => {
                  const value = moodAverages?.[key] || 0
                  const isStress = key === "stress_level"
                  const normalizedValue = isStress ? 6 - value : value
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{label}</span>
                        <span className={getMoodColor(normalizedValue)}>{value.toFixed(1)} / 5</span>
                      </div>
                      <Progress
                        value={value * 20}
                        className={`h-2 ${isStress && value >= 4 ? "[&>div]:bg-red-500" : ""}`}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Meh className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Noch keine Stimmungsdaten vorhanden</p>
                <Button variant="outline" className="mt-4" onClick={onStartFirstSurvey}>
                  Erste Umfrage starten
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Kudos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Letzte Kudos
            </CardTitle>
            <CardDescription>Peer-Recognition im Team</CardDescription>
          </CardHeader>
          <CardContent>
            {kudosList.length > 0 ? (
              <div className="space-y-4">
                {kudosList.slice(0, 3).map((kudos) => {
                  const category = KUDOS_CATEGORIES.find((c) => c.value === kudos.category)
                  return (
                    <div key={kudos.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`p-2 rounded-full ${category?.color || "bg-gray-500"}`}>
                        {category?.icon && <category.icon className="h-4 w-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">
                            {kudos.is_anonymous ? "Anonym" : kudos.from_user_name || "Unbekannt"}
                          </span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{kudos.to_user_name || "Unbekannt"}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{kudos.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {category?.label || kudos.category}
                          </Badge>
                          {Object.entries(kudos.reactions || {}).map(([emoji, count]) => (
                            <span key={emoji} className="text-xs">
                              {emoji} {count}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <PartyPopper className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Noch keine Kudos vorhanden</p>
                <Button variant="outline" className="mt-4 bg-transparent" onClick={onShowKudosDialog}>
                  Ersten Kudos senden
                </Button>
              </div>
            )}
          </CardContent>
          {kudosList.length > 3 && (
            <CardFooter>
              <Button variant="ghost" className="w-full" onClick={onSwitchToKudosTab}>
                Alle Kudos anzeigen
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Workload Summary */}
      {workloadAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Arbeitsbelastungs-Zusammenfassung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{workloadAnalysis.avg_weekly_hours?.toFixed(1) || "\u2013"}h</div>
                <p className="text-sm text-muted-foreground">{"Ø Wochenstunden"}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{workloadAnalysis.overtime_percentage?.toFixed(0) || "\u2013"}%</div>
                <p className="text-sm text-muted-foreground">{"Überstunden"}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{workloadAnalysis.sick_leave_rate?.toFixed(1) || "\u2013"}%</div>
                <p className="text-sm text-muted-foreground">Krankenquote</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className={`text-2xl font-bold ${getBurnoutRiskColor(workloadAnalysis.burnout_risk_score)} text-white px-3 py-1 rounded`}>
                  {workloadAnalysis.burnout_risk_score}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">Burnout-Risiko</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

import React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Brain,
  Edit3,
  Plus,
  History,
  RefreshCw,
  CheckCircle2,
  Lightbulb,
  LineChart,
  Calendar,
} from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Area,
  AreaChart,
} from "recharts"
import type { PermaScores, PermaAssessment, ActionItem } from "../types"

interface PermaDimension {
  letter: string
  title: string
  dbKey: string
  lightColor: string
  textColor: string
}

interface OverviewTabProps {
  permaScores: PermaScores
  overallScore: number
  assessmentHistory: PermaAssessment[]
  practiceAverages: PermaScores | null
  actionItems: ActionItem[]
  permaVModel: PermaDimension[]
  getScoreColor: (score: number) => string
  getScoreBadge: (score: number) => { label: string; className: string }
  getStrongestDimensions: () => { title: string; score: number; icon: React.ReactNode }[]
  getWeakestDimensions: () => { title: string; score: number; icon: React.ReactNode }[]
  getRadarData: () => { dimension: string; score: number; average?: number }[]
  getChartData: () => { date: string; Gesamt: number }[]
  onEditScores: () => void
  onNewAssessment: () => void
  onShowHistory: () => void
  onRefresh: () => void
  onAddAction: () => void
  onToggleActionStatus: (id: string) => void
}

export function OverviewTab({
  permaScores,
  overallScore,
  assessmentHistory,
  practiceAverages,
  actionItems,
  permaVModel,
  getScoreColor,
  getScoreBadge,
  getStrongestDimensions,
  getWeakestDimensions,
  getRadarData,
  getChartData,
  onEditScores,
  onNewAssessment,
  onShowHistory,
  onRefresh,
  onAddAction,
  onToggleActionStatus,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Header Card with Score */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <Brain className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">PERMA-V Modell</h2>
                <p className="text-muted-foreground">
                  Das PERMA-V Modell beschreibt die sechs Säulen des Wohlbefindens
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}%</div>
              <Badge variant="outline" className={getScoreBadge(overallScore).className}>
                {getScoreBadge(overallScore).label}
              </Badge>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-6">
            <Button onClick={onEditScores} className="gap-2">
              <Edit3 className="h-4 w-4" />
              Bewertung bearbeiten
            </Button>
            <Button variant="outline" onClick={onNewAssessment} className="gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Neue Bewertung
            </Button>
            <Button variant="ghost" onClick={onShowHistory} className="gap-2">
              <History className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={onRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 font-medium">Stärkste Dimension</p>
                <p className="text-2xl font-bold text-emerald-800">{getStrongestDimensions()[0]?.title}</p>
              </div>
              <div className="p-3 rounded-full bg-emerald-500 text-white">
                {getStrongestDimensions()[0]?.icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-600 mt-2">{getStrongestDimensions()[0]?.score}%</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 font-medium">Verbesserungspotenzial</p>
                <p className="text-2xl font-bold text-amber-800">{getWeakestDimensions()[0]?.title}</p>
              </div>
              <div className="p-3 rounded-full bg-amber-500 text-white">{getWeakestDimensions()[0]?.icon}</div>
            </div>
            <p className="text-3xl font-bold text-amber-600 mt-2">{getWeakestDimensions()[0]?.score}%</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-700 font-medium">Offene Maßnahmen</p>
                <p className="text-2xl font-bold text-indigo-800">
                  {actionItems.filter((i) => i.status !== "completed").length} von {actionItems.length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-indigo-500 text-white">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <Progress
              value={
                actionItems.length > 0
                  ? (actionItems.filter((i) => i.status === "completed").length / actionItems.length) * 100
                  : 0
              }
              className="mt-3 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-500" />
              PERMA-V Profil
            </CardTitle>
            <CardDescription>Ihre aktuelle Bewertung im Überblick</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={getRadarData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name="Ihr Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                  {practiceAverages && (
                    <Radar
                      name="Praxis-Durchschnitt"
                      dataKey="average"
                      stroke="#94a3b8"
                      fill="#94a3b8"
                      fillOpacity={0.2}
                    />
                  )}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-emerald-500" />
              Entwicklung über Zeit
            </CardTitle>
            <CardDescription>Gesamtscore der letzten Bewertungen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {assessmentHistory.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getChartData()}>
                    <defs>
                      <linearGradient id="colorGesamt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="Gesamt"
                      stroke="#6366f1"
                      fill="url(#colorGesamt)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Noch nicht genügend Daten für Trendanalyse</p>
                    <p className="text-sm">Erstellen Sie weitere Bewertungen</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Maßnahmen & Aktionen
              </CardTitle>
              <CardDescription>Ihre geplanten Verbesserungsmaßnahmen</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onAddAction} className="gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Maßnahme hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {actionItems.length > 0 ? (
            <div className="space-y-3">
              {actionItems.map((item) => {
                const dimension = permaVModel.find((d) => d.dbKey === item.dimension)
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      item.status === "completed" ? "bg-emerald-50 border-emerald-200" : "bg-muted/50"
                    }`}
                  >
                    <button onClick={() => onToggleActionStatus(item.id)} className="flex-shrink-0">
                      {item.status === "completed" ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium ${
                          item.status === "completed" ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {dimension && (
                          <Badge variant="outline" className={dimension.lightColor}>
                            <span className={dimension.textColor}>{dimension.letter}</span>
                            <span className="ml-1 text-muted-foreground">{dimension.title}</span>
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            item.priority === "high"
                              ? "border-red-200 text-red-700"
                              : item.priority === "medium"
                                ? "border-amber-200 text-amber-700"
                                : "border-slate-200 text-slate-700"
                          }
                        >
                          {item.priority === "high" ? "Hoch" : item.priority === "medium" ? "Mittel" : "Niedrig"}
                        </Badge>
                      </div>
                    </div>
                    {item.dueDate && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(item.dueDate), "dd.MM.yyyy", { locale: de })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Maßnahmen geplant</p>
              <p className="text-sm">Fügen Sie Maßnahmen hinzu, um Ihre PERMA-V Scores zu verbessern</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

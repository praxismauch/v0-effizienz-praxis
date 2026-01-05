"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Sparkles, TrendingUp, Users, AlertTriangle, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { FormattedAIContent } from "@/components/formatted-ai-content"

interface AITeamAnalysisDialogProps {
  practiceId: string
  children: React.ReactNode
}

export function AITeamAnalysisDialog({ practiceId, children }: AITeamAnalysisDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<any>(null)
  const [progress, setProgress] = useState(0)

  const handleAnalyze = async () => {
    setLoading(true)
    setProgress(0)

    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 300)

    try {
      const res = await fetch(`/api/practices/${practiceId}/team/ai-analyze`, {
        method: "POST",
      })

      if (!res.ok) {
        throw new Error("Analyse fehlgeschlagen")
      }

      const data = await res.json()
      setAnalysis(data.analysis)
      setStatistics(data.statistics)
      setProgress(100)
    } catch (error) {
      console.error("Error analyzing team:", error)
      alert("Fehler bei der Team-Analyse")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && !analysis) {
      handleAnalyze()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-gestützte Team-Analyse
          </DialogTitle>
          <DialogDescription>
            Detaillierte Analyse Ihrer Team-Struktur, Personalplanung und Entwicklungspotenziale
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-4 py-8">
            <div className="flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">Analysiere Team-Daten... {progress}%</p>
            </div>
          </div>
        )}

        {!loading && statistics && (
          <div className="space-y-6">
            {/* Statistics Overview */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team-Größe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalMembers}</div>
                  <p className="text-xs text-muted-foreground">Aktive Mitglieder</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />Ø Alter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.avgAge ? `${statistics.avgAge} Jahre` : "-"}</div>
                  <p className="text-xs text-muted-foreground">Durchschnittsalter</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Verträge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.contracts.filter((c: any) => c.activeContracts > 0).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Aktive Verträge</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Pläne
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.staffingPlansCount}</div>
                  <p className="text-xs text-muted-foreground">Bedarfspläne</p>
                </CardContent>
              </Card>
            </div>

            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Rollen-Verteilung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statistics.roleDistribution).map(([role, count]: any) => (
                    <Badge key={role} variant="secondary">
                      {role}: {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            {analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    KI-Analyse & Empfehlungen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormattedAIContent content={analysis} className="prose-sm" />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

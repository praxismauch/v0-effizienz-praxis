"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/contexts/user-context" // Import useUser hook
import { usePractice } from "@/contexts/practice-context" // Import usePractice hook
import {
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  DollarSign,
  Lightbulb,
  ClipboardList,
  Clock,
  ThumbsUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreateIgelDialog } from "./create-igel-dialog"
import { EditIgelDialog } from "./edit-igel-dialog"
import { useIgelAnalyses } from "@/hooks/use-igel"

interface IgelAnalysis {
  id: string
  service_name: string
  service_description: string
  category: string
  profitability_score: number
  recommendation: string
  break_even_point: number
  status: string
  pricing_scenarios: any[]
  created_at: string
  arzt_minutes?: number
  honorar_goal?: number
}

export function IgelManagement() {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editAnalysis, setEditAnalysis] = useState<IgelAnalysis | null>(null)
  const { currentPractice } = usePractice()

  const practiceId = currentPractice?.id
  const { analyses, isLoading: loading, error, mutate: mutateAnalyses } = useIgelAnalyses(practiceId)

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation?.includes("Sehr empfehlenswert")) return "default"
    if (recommendation?.includes("Bedingt")) return "secondary"
    return "destructive"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (score >= 40) return <AlertCircle className="h-4 w-4 text-yellow-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  if (loading) {
    return <div>Lädt...</div>
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Fehler beim Laden</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            {error.message || "Ein Fehler ist aufgetreten"}
          </p>
          <Button onClick={() => mutateAnalyses()}>Erneut versuchen</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with title and action button */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Selbstzahler-Analyse</h1>
          <p className="text-muted-foreground">
            Analysieren Sie Ihre Selbstzahlerleistungen auf Rentabilität und Optimierungspotenzial
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="lg" className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Neue Analyse
        </Button>
      </div>

      {/* Professional info card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">KI-gestützte Rentabilitätsanalyse</h3>
              <p className="text-sm text-muted-foreground">
                Finden Sie heraus, welche Selbstzahlerleistungen sich für Ihre Praxis wirklich lohnen
              </p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-background">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Vollständige Kostenanalyse</h4>
                <p className="text-xs text-muted-foreground">Fixkosten, variable Kosten und versteckte Aufwände</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-background">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">3 Preisszenarien</h4>
                <p className="text-xs text-muted-foreground">Konservativ, realistisch und optimistisch</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-background">
                <ThumbsUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Klare Empfehlungen</h4>
                <p className="text-xs text-muted-foreground">Datenbasierte Optimierungsvorschläge</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {analyses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Noch keine Analysen vorhanden</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Starten Sie Ihre erste Analyse, um herauszufinden, welche Selbstzahlerleistungen sich für Ihre Praxis
              lohnen
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Erste Analyse erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {analyses.map((analysis) => (
              <Card
                key={analysis.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/igel/${analysis.id}`)}
              >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl font-bold truncate">{analysis.service_name}</CardTitle>
                    {analysis.category && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {analysis.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {getScoreIcon(analysis.profitability_score || 0)}
                    <span className="text-lg font-bold">{analysis.profitability_score || 0}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.service_description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{analysis.service_description}</p>
                )}
                {analysis.recommendation && (
                  <Badge variant={getRecommendationColor(analysis.recommendation)}>{analysis.recommendation}</Badge>
                )}
                
                {/* Profit per item - using realistic scenario (index 1) */}
                {analysis.pricing_scenarios?.length > 1 && analysis.pricing_scenarios[1]?.monthlyProfit !== undefined && analysis.pricing_scenarios[1]?.expected_monthly_demand > 0 && (() => {
                  const scenario = analysis.pricing_scenarios[1] // Realistic scenario
                  const profitPerItem = scenario.monthlyProfit / scenario.expected_monthly_demand
                  const isProfitable = profitPerItem > 0
                  
                  return (
                    <div className="rounded-lg bg-muted/30 border border-border p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Gewinn pro Leistung</span>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${isProfitable ? "bg-green-50" : "bg-red-50"}`}>
                          <DollarSign className={`h-4 w-4 ${isProfitable ? "text-green-600" : "text-red-600"}`} />
                        </div>
                      </div>
                      <div className={`text-3xl font-bold tabular-nums mt-2 ${isProfitable ? "text-green-600" : "text-red-600"}`}>
                        {profitPerItem >= 0 ? "+" : ""}{profitPerItem.toFixed(2)} €
                      </div>
                    </div>
                  )
                })()}
                
                {analysis.break_even_point > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Break-Even: <span className="font-semibold text-foreground">{analysis.break_even_point} Leistungen</span>
                  </p>
                )}
                {/* Honorarstundensatz-SZL: price * 60 / arzt_minutes */}
                {analysis.arzt_minutes && analysis.arzt_minutes > 0 && analysis.pricing_scenarios?.[1]?.price && (() => {
                  const calculatedHourlyRate = (analysis.pricing_scenarios[1].price * 60) / analysis.arzt_minutes
                  const targetRate = analysis.honorar_goal || 500
                  const isRecommended = calculatedHourlyRate >= targetRate
                  const difference = calculatedHourlyRate - targetRate
                  const percentOfGoal = (calculatedHourlyRate / targetRate) * 100
                  
                  return (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Honorarstundensatz
                        </span>
                        <span className={`font-bold text-lg ${isRecommended ? "text-green-600" : "text-amber-600"}`}>
                          {calculatedHourlyRate.toFixed(0)} €/Std
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Ziel</span>
                        <span className="font-medium">{targetRate} €/Std</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Differenz</span>
                        <span className={`font-medium ${difference >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {difference >= 0 ? "+" : ""}{difference.toFixed(0)} €/Std ({percentOfGoal.toFixed(0)}%)
                        </span>
                      </div>
                      {isRecommended ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700 w-full justify-center">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Ziel erreicht
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 w-full justify-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Unter Ziel ({(targetRate - calculatedHourlyRate).toFixed(0)} € fehlen)
                        </Badge>
                      )}
                    </div>
                  )
                })()}
                {analysis.pricing_scenarios?.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {analysis.pricing_scenarios.length} Preisszenarien analysiert
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateIgelDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          mutateAnalyses()
          setCreateOpen(false)
        }}
      />

      {editAnalysis && (
        <EditIgelDialog
          analysis={editAnalysis}
          open={!!editAnalysis}
          onOpenChange={(open) => {
            if (!open) setEditAnalysis(null)
          }}
          onSuccess={() => {
            mutateAnalyses()
            setEditAnalysis(null)
          }}
        />
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Pencil,
  ArrowLeft,
  Trash2,
  Calculator,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/app-layout"
import { ViewRoiAnalysisDialog } from "@/components/roi/view-roi-analysis-dialog"
import { DeleteIconButton } from "@/components/delete-icon-button"

export default function RoiAnalysisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`/api/roi-analysis/${id}`)
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      } else {
        router.push("/roi-analysis")
      }
    } catch (error) {
      console.error("Error fetching analysis:", error)
      router.push("/roi-analysis")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalysis()
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/roi-analysis/${id}`, { method: "DELETE" })
      if (response.ok) {
        router.push("/roi-analysis")
      }
    } catch (error) {
      console.error("Error deleting analysis:", error)
    } finally {
      setDeleting(false)
    }
  }

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case "highly_recommended":
        return <Badge className="bg-green-500 text-lg px-4 py-1">Sehr empfehlenswert</Badge>
      case "recommended":
        return <Badge className="bg-blue-500 text-lg px-4 py-1">Empfehlenswert</Badge>
      case "neutral":
        return <Badge variant="secondary" className="text-lg px-4 py-1">Neutral</Badge>
      case "not_recommended":
        return <Badge variant="destructive" className="text-lg px-4 py-1">Nicht empfohlen</Badge>
      default:
        return <Badge variant="outline" className="text-lg px-4 py-1">Unbekannt</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return "bg-green-500"
    if (score >= 50) return "bg-blue-500"
    if (score >= 25) return "bg-orange-500"
    return "bg-red-500"
  }

  const calculateProfit = (price: number, variableCost: number, demand: number, fixedCost: number) => {
    const monthlyProfit = (price - variableCost) * demand
    const yearlyProfit = monthlyProfit * 12
    const netProfit = yearlyProfit - fixedCost
    return { monthlyProfit, yearlyProfit, netProfit }
  }

  if (loading || !analysis) {
    return <AppLayout loading={true} loadingMessage="Analyse wird geladen..." />
  }

  const pessimisticProfit = calculateProfit(
    analysis.scenario_pessimistic,
    analysis.total_variable_costs,
    analysis.demand_pessimistic,
    analysis.total_fixed_costs,
  )
  const realisticProfit = calculateProfit(
    analysis.scenario_realistic,
    analysis.total_variable_costs,
    analysis.demand_realistic,
    analysis.total_fixed_costs,
  )
  const optimisticProfit = calculateProfit(
    analysis.scenario_optimistic,
    analysis.total_variable_costs,
    analysis.demand_optimistic,
    analysis.total_fixed_costs,
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/roi-analysis")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Calculator className="h-8 w-8" />
                {analysis.service_name}
              </h1>
              {analysis.description && (
                <p className="text-muted-foreground mt-1">{analysis.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
            <DeleteIconButton
              onDelete={handleDelete}
              tooltip="Analyse löschen"
              confirmTitle="Analyse löschen?"
              confirmDescription={`Möchten Sie die Analyse "${analysis.service_name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
              disabled={deleting}
            />
          </div>
        </div>

        {/* ROI Score & Recommendation */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">ROI-Bewertung</h3>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold">{analysis.roi_score}/100</span>
                  {getRecommendationBadge(analysis.recommendation)}
                </div>
              </div>
              <div className="text-right">
                {analysis.recommendation === "highly_recommended" || analysis.recommendation === "recommended" ? (
                  <ThumbsUp className="h-16 w-16 text-green-500" />
                ) : (
                  <ThumbsDown className="h-16 w-16 text-red-500" />
                )}
              </div>
            </div>
            <Progress value={analysis.roi_score} className={`h-3 ${getScoreColor(analysis.roi_score)}`} />
            {analysis.recommendation_reason && (
              <div className="mt-4 p-3 bg-muted rounded-lg flex gap-2">
                <Lightbulb className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{analysis.recommendation_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scenarios Comparison */}
        <Tabs defaultValue="realistic">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pessimistic">Pessimistisch</TabsTrigger>
            <TabsTrigger value="realistic">Realistisch</TabsTrigger>
            <TabsTrigger value="optimistic">Optimistisch</TabsTrigger>
          </TabsList>

          {[
            { key: "pessimistic", label: "Pessimistisch", price: analysis.scenario_pessimistic, demand: analysis.demand_pessimistic, profit: pessimisticProfit },
            { key: "realistic", label: "Realistisch", price: analysis.scenario_realistic, demand: analysis.demand_realistic, profit: realisticProfit },
            { key: "optimistic", label: "Optimistisch", price: analysis.scenario_optimistic, demand: analysis.demand_optimistic, profit: optimisticProfit },
          ].map((scenario) => (
            <TabsContent key={scenario.key} value={scenario.key} className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Preis pro Leistung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{scenario.price?.toFixed(2)} EUR</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Nachfrage/Monat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{scenario.demand}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Gewinn/Monat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${scenario.profit.monthlyProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {scenario.profit.monthlyProfit.toFixed(2)} EUR
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Nettogewinn (1. Jahr)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${scenario.profit.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {scenario.profit.netProfit.toFixed(2)} EUR
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Cost Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Fixkosten (einmalig)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis.fixed_costs?.map((cost: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{cost.name}</span>
                    <span className="font-medium">{cost.amount?.toFixed(2)} EUR</span>
                  </div>
                ))}
                <div className="pt-2 border-t flex justify-between font-bold">
                  <span>Gesamt</span>
                  <span>{analysis.total_fixed_costs?.toFixed(2)} EUR</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variable Kosten (pro Leistung)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis.variable_costs?.map((cost: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{cost.name}</span>
                    <span className="font-medium">{cost.amount?.toFixed(2)} EUR</span>
                  </div>
                ))}
                <div className="pt-2 border-t flex justify-between font-bold">
                  <span>Gesamt</span>
                  <span>{analysis.total_variable_costs?.toFixed(2)} EUR</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Amortization */}
        {analysis.break_even_months && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Amortisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">{analysis.break_even_months.toFixed(1)} Monate</p>
              <p className="text-sm text-muted-foreground">
                Bei realistischer Nachfrage amortisiert sich die Investition in etwa{" "}
                {analysis.break_even_months.toFixed(1)} Monaten.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <ViewRoiAnalysisDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        analysisId={id}
        onUpdated={() => fetchAnalysis()}
        initialEditMode
      />
    </AppLayout>
  )
}

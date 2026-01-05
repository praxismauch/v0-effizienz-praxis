"use client"

import { useState, useEffect } from "react"
import { Calendar, ThumbsUp, ThumbsDown, Lightbulb } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ViewRoiAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysisId: string
  onUpdated: () => void
}

export function ViewRoiAnalysisDialog({ open, onOpenChange, analysisId, onUpdated }: ViewRoiAnalysisDialogProps) {
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && analysisId) {
      fetchAnalysis()
    }
  }, [open, analysisId])

  const fetchAnalysis = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/roi-analysis/${analysisId}`)
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      }
    } catch (error) {
      console.error("Error fetching analysis:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case "highly_recommended":
        return <Badge className="bg-green-500 text-lg px-4 py-1">Sehr empfehlenswert</Badge>
      case "recommended":
        return <Badge className="bg-blue-500 text-lg px-4 py-1">Empfehlenswert</Badge>
      case "neutral":
        return (
          <Badge variant="secondary" className="text-lg px-4 py-1">
            Neutral
          </Badge>
        )
      case "not_recommended":
        return (
          <Badge variant="destructive" className="text-lg px-4 py-1">
            Nicht empfohlen
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-lg px-4 py-1">
            Unbekannt
          </Badge>
        )
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
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{analysis.service_name}</DialogTitle>
          {analysis.description && <DialogDescription className="text-base">{analysis.description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-6">
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

            <TabsContent value="pessimistic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Preis pro Leistung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{analysis.scenario_pessimistic.toFixed(2)} €</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Nachfrage/Monat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{analysis.demand_pessimistic}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Gewinn/Monat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p
                      className={`text-2xl font-bold ${pessimisticProfit.monthlyProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {pessimisticProfit.monthlyProfit.toFixed(2)} €
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Nettogewinn (1. Jahr)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p
                      className={`text-2xl font-bold ${pessimisticProfit.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {pessimisticProfit.netProfit.toFixed(2)} €
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="realistic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Preis pro Leistung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{analysis.scenario_realistic.toFixed(2)} €</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Nachfrage/Monat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{analysis.demand_realistic}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Gewinn/Monat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p
                      className={`text-2xl font-bold ${realisticProfit.monthlyProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {realisticProfit.monthlyProfit.toFixed(2)} €
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Nettogewinn (1. Jahr)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p
                      className={`text-2xl font-bold ${realisticProfit.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {realisticProfit.netProfit.toFixed(2)} €
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="optimistic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Preis pro Leistung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{analysis.scenario_optimistic.toFixed(2)} €</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Nachfrage/Monat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{analysis.demand_optimistic}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Gewinn/Monat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p
                      className={`text-2xl font-bold ${optimisticProfit.monthlyProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {optimisticProfit.monthlyProfit.toFixed(2)} €
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Nettogewinn (1. Jahr)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p
                      className={`text-2xl font-bold ${optimisticProfit.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {optimisticProfit.netProfit.toFixed(2)} €
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Cost Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Fixkosten (einmalig)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.fixed_costs?.map((cost: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{cost.name}</span>
                      <span className="font-medium">{cost.amount.toFixed(2)} €</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t flex justify-between font-bold">
                    <span>Gesamt</span>
                    <span>{analysis.total_fixed_costs.toFixed(2)} €</span>
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
                      <span className="font-medium">{cost.amount.toFixed(2)} €</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t flex justify-between font-bold">
                    <span>Gesamt</span>
                    <span>{analysis.total_variable_costs.toFixed(2)} €</span>
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
      </DialogContent>
    </Dialog>
  )
}

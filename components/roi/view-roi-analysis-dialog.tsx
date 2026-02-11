"use client"

import { useState, useEffect } from "react"
import { Calendar, ThumbsUp, ThumbsDown, Lightbulb, Pencil, Save, X, Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/format-currency"
import { NettoBruttoCalculator } from "@/components/ui/netto-brutto-calculator"

interface CostItem {
  name: string
  amount: number
}

function toArray(val: unknown): CostItem[] {
  if (Array.isArray(val)) return val
  if (typeof val === "string") {
    try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : [] } catch { return [] }
  }
  return []
}

interface ViewRoiAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysisId: string
  onUpdated: () => void
}

export function ViewRoiAnalysisDialog({ open, onOpenChange, analysisId, onUpdated }: ViewRoiAnalysisDialogProps) {
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [serviceName, setServiceName] = useState("")
  const [description, setDescription] = useState("")
  const [fixedCosts, setFixedCosts] = useState<CostItem[]>([])
  const [variableCosts, setVariableCosts] = useState<CostItem[]>([])
  const [pricePessimistic, setPricePessimistic] = useState(0)
  const [priceRealistic, setPriceRealistic] = useState(0)
  const [priceOptimistic, setPriceOptimistic] = useState(0)
  const [demandPessimistic, setDemandPessimistic] = useState(0)
  const [demandRealistic, setDemandRealistic] = useState(0)
  const [demandOptimistic, setDemandOptimistic] = useState(0)

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
        // Initialize edit form state
        setServiceName(data.service_name || "")
        setDescription(data.description || "")
        setFixedCosts(toArray(data.fixed_costs))
        setVariableCosts(toArray(data.variable_costs))
        setPricePessimistic(data.scenario_pessimistic || 0)
        setPriceRealistic(data.scenario_realistic || 0)
        setPriceOptimistic(data.scenario_optimistic || 0)
        setDemandPessimistic(data.demand_pessimistic || 0)
        setDemandRealistic(data.demand_realistic || 0)
        setDemandOptimistic(data.demand_optimistic || 0)
      }
    } catch (error) {
      console.error("Error fetching analysis:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    console.log("[v0] ROI Edit - Starting save")
    
    if (!serviceName.trim()) {
      console.log("[v0] ROI Edit - Validation failed: empty service name")
      alert("Bitte geben Sie einen Namen für die Leistung ein.")
      return
    }

    console.log("[v0] ROI Edit - Analysis ID:", analysisId)
    console.log("[v0] ROI Edit - Service name:", serviceName)

    setSaving(true)
    try {
      const totalFixed = fixedCosts.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0)
      const totalVariable = variableCosts.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0)

      const payload = {
        service_name: serviceName,
        description,
        fixed_costs: fixedCosts.filter((c) => c.name && c.amount > 0),
        variable_costs: variableCosts.filter((c) => c.name && c.amount > 0),
        total_fixed_costs: totalFixed,
        total_variable_costs: totalVariable,
        scenario_pessimistic: Number(pricePessimistic) || 0,
        scenario_realistic: Number(priceRealistic) || 0,
        scenario_optimistic: Number(priceOptimistic) || 0,
        demand_pessimistic: Number(demandPessimistic) || 0,
        demand_realistic: Number(demandRealistic) || 0,
        demand_optimistic: Number(demandOptimistic) || 0,
      }

      console.log("[v0] ROI Edit - Payload:", payload)

      const response = await fetch(`/api/roi-analysis/${analysisId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("[v0] ROI Edit - Response status:", response.status)

      if (response.ok) {
        const updatedAnalysis = await response.json()
        console.log("[v0] ROI Edit - Success, updated analysis:", updatedAnalysis)
        setAnalysis(updatedAnalysis)
        setIsEditing(false)
        onUpdated()
        alert("Änderungen erfolgreich gespeichert!")
      } else {
        const error = await response.json()
        console.error("[v0] ROI Edit - Error response:", error)
        alert(error.error || "Fehler beim Speichern: " + response.statusText)
      }
    } catch (error) {
      console.error("[v0] ROI Edit - Exception:", error)
      alert("Fehler beim Speichern: " + (error instanceof Error ? error.message : String(error)))
    } finally {
      console.log("[v0] ROI Edit - Save completed, setSaving(false)")
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    // Reset to original values
    if (analysis) {
      setServiceName(analysis.service_name || "")
      setDescription(analysis.description || "")
      setFixedCosts(toArray(analysis.fixed_costs))
      setVariableCosts(toArray(analysis.variable_costs))
      setPricePessimistic(analysis.scenario_pessimistic || 0)
      setPriceRealistic(analysis.scenario_realistic || 0)
      setPriceOptimistic(analysis.scenario_optimistic || 0)
      setDemandPessimistic(analysis.demand_pessimistic || 0)
      setDemandRealistic(analysis.demand_realistic || 0)
      setDemandOptimistic(analysis.demand_optimistic || 0)
    }
    setIsEditing(false)
  }

  // Cost management functions
  const addFixedCost = () => setFixedCosts([...fixedCosts, { name: "", amount: 0 }])
  const removeFixedCost = (index: number) => setFixedCosts(fixedCosts.filter((_, i) => i !== index))
  const updateFixedCost = (index: number, field: "name" | "amount", value: string | number) => {
    const updated = [...fixedCosts]
    updated[index] = { ...updated[index], [field]: field === "amount" ? Math.max(0, Number(value) || 0) : value }
    setFixedCosts(updated)
  }

  const addVariableCost = () => setVariableCosts([...variableCosts, { name: "", amount: 0 }])
  const removeVariableCost = (index: number) => setVariableCosts(variableCosts.filter((_, i) => i !== index))
  const updateVariableCost = (index: number, field: "name" | "amount", value: string | number) => {
    const updated = [...variableCosts]
    updated[index] = { ...updated[index], [field]: field === "amount" ? Math.max(0, Number(value) || 0) : value }
    setVariableCosts(updated)
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
          <DialogTitle className="sr-only">Analyse wird geladen</DialogTitle>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const totalFixed = fixedCosts.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0)
  const totalVariable = variableCosts.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0)

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

  // Edit Mode UI
  if (isEditing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Analyse bearbeiten</DialogTitle>
            <DialogDescription>Ändern Sie die Daten der ROI-Analyse</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Grunddaten</TabsTrigger>
              <TabsTrigger value="fixed">Fixkosten</TabsTrigger>
              <TabsTrigger value="variable">Variable Kosten</TabsTrigger>
              <TabsTrigger value="scenarios">Szenarien</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceName">Name der Leistung*</Label>
                <Input
                  id="serviceName"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="z.B. Akupunktur, IGEL-Leistung"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optionale Beschreibung"
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="fixed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fixkosten (einmalig)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fixedCosts.map((cost, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={cost.name}
                        onChange={(e) => updateFixedCost(index, "name", e.target.value)}
                        placeholder="Kostenart"
                        className="flex-1"
                      />
                      <div className="flex items-center gap-1">
                        <div className="relative">
                          <Input
                            type="number"
                            value={cost.amount}
                            onChange={(e) => updateFixedCost(index, "amount", Number(e.target.value))}
                            placeholder="Betrag"
                            className="w-32 pr-12"
                            min="0"
                            step="0.01"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            EUR
                          </span>
                        </div>
                        <NettoBruttoCalculator onApply={(brutto) => updateFixedCost(index, "amount", brutto)} />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFixedCost(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addFixedCost} className="w-full bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Weitere Fixkosten hinzufügen
                  </Button>
                  <div className="pt-3 border-t flex justify-between items-center font-semibold">
                    <span>Gesamt Fixkosten:</span>
                    <span className="text-lg">{formatCurrency(totalFixed)}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="variable" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Variable Kosten (pro Leistung)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {variableCosts.map((cost, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={cost.name}
                        onChange={(e) => updateVariableCost(index, "name", e.target.value)}
                        placeholder="Kostenart"
                        className="flex-1"
                      />
                      <div className="flex items-center gap-1">
                        <div className="relative">
                          <Input
                            type="number"
                            value={cost.amount}
                            onChange={(e) => updateVariableCost(index, "amount", Number(e.target.value))}
                            placeholder="Betrag"
                            className="w-32 pr-12"
                            min="0"
                            step="0.01"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            EUR
                          </span>
                        </div>
                        <NettoBruttoCalculator onApply={(brutto) => updateVariableCost(index, "amount", brutto)} />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeVariableCost(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addVariableCost} className="w-full bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Weitere variable Kosten hinzufügen
                  </Button>
                  <div className="pt-3 border-t flex justify-between items-center font-semibold">
                    <span>Gesamt variable Kosten:</span>
                    <span className="text-lg">{formatCurrency(totalVariable)} pro Leistung</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scenarios" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Preis-Szenarien</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold">Pessimistisch</Label>
                      <div className="flex items-center gap-1">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            value={pricePessimistic}
                            onChange={(e) => setPricePessimistic(Math.max(0, Number(e.target.value) || 0))}
                            min="0"
                            step="0.01"
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            EUR
                          </span>
                        </div>
                        <NettoBruttoCalculator onApply={(brutto) => setPricePessimistic(Math.max(0, brutto))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Realistisch</Label>
                      <div className="flex items-center gap-1">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            value={priceRealistic}
                            onChange={(e) => setPriceRealistic(Math.max(0, Number(e.target.value) || 0))}
                            min="0"
                            step="0.01"
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            EUR
                          </span>
                        </div>
                        <NettoBruttoCalculator onApply={(brutto) => setPriceRealistic(Math.max(0, brutto))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Optimistisch</Label>
                      <div className="flex items-center gap-1">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            value={priceOptimistic}
                            onChange={(e) => setPriceOptimistic(Math.max(0, Number(e.target.value) || 0))}
                            min="0"
                            step="0.01"
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            EUR
                          </span>
                        </div>
                        <NettoBruttoCalculator onApply={(brutto) => setPriceOptimistic(Math.max(0, brutto))} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Nachfrage-Szenarien (Leistungen/Monat)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Pessimistisch</Label>
                      <Input
                        type="number"
                        value={demandPessimistic}
                        onChange={(e) => setDemandPessimistic(Math.max(0, Number(e.target.value) || 0))}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Realistisch</Label>
                      <Input
                        type="number"
                        value={demandRealistic}
                        onChange={(e) => setDemandRealistic(Math.max(0, Number(e.target.value) || 0))}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Optimistisch</Label>
                      <Input
                        type="number"
                        value={demandOptimistic}
                        onChange={(e) => setDemandOptimistic(Math.max(0, Number(e.target.value) || 0))}
                        min="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={cancelEdit} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // View Mode UI (original)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{analysis.service_name}</DialogTitle>
              {analysis.description && (
                <DialogDescription className="text-base">{analysis.description}</DialogDescription>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          </div>
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

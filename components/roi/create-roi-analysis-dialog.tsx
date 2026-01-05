"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/format-currency"
import { NettoBruttoCalculator } from "@/components/ui/netto-brutto-calculator"

interface CostItem {
  name: string
  amount: number
}

interface CreateRoiAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  practiceId: string
  userId: string
}

export function CreateRoiAnalysisDialog({
  open,
  onOpenChange,
  onSuccess,
  practiceId,
  userId,
}: CreateRoiAnalysisDialogProps) {
  const [serviceName, setServiceName] = useState("")
  const [description, setDescription] = useState("")
  const [fixedCosts, setFixedCosts] = useState<CostItem[]>([
    { name: "Anschaffung (Gerät, Software, Einrichtung)", amount: 0 },
    { name: "Schulungs-/Einarbeitungszeit", amount: 0 },
    { name: "Zertifikate / Kurse", amount: 0 },
    { name: "Marketing / Flyer / Webseite", amount: 0 },
    { name: "Implementierungsaufwand", amount: 0 },
  ])
  const [variableCosts, setVariableCosts] = useState<CostItem[]>([
    { name: "Materialkosten", amount: 0 },
    { name: "Arbeitszeit (inkl. MFA/Arzt-Zeit)", amount: 0 },
    { name: "Abrechnungskosten / Softwarekosten", amount: 0 },
    { name: "Verbrauchsmaterial", amount: 0 },
  ])
  const [pricePessimistic, setPricePessimistic] = useState(0)
  const [priceRealistic, setPriceRealistic] = useState(0)
  const [priceOptimistic, setPriceOptimistic] = useState(0)
  const [demandPessimistic, setDemandPessimistic] = useState(0)
  const [demandRealistic, setDemandRealistic] = useState(0)
  const [demandOptimistic, setDemandOptimistic] = useState(0)
  const [saving, setSaving] = useState(false)

  const addFixedCost = () => {
    setFixedCosts([...fixedCosts, { name: "", amount: 0 }])
  }

  const removeFixedCost = (index: number) => {
    setFixedCosts(fixedCosts.filter((_, i) => i !== index))
  }

  const updateFixedCost = (index: number, field: "name" | "amount", value: string | number) => {
    const updated = [...fixedCosts]
    if (field === "amount") {
      updated[index] = { ...updated[index], [field]: Math.max(0, Number(value) || 0) }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setFixedCosts(updated)
  }

  const addVariableCost = () => {
    setVariableCosts([...variableCosts, { name: "", amount: 0 }])
  }

  const removeVariableCost = (index: number) => {
    setVariableCosts(variableCosts.filter((_, i) => i !== index))
  }

  const updateVariableCost = (index: number, field: "name" | "amount", value: string | number) => {
    const updated = [...variableCosts]
    if (field === "amount") {
      updated[index] = { ...updated[index], [field]: Math.max(0, Number(value) || 0) }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setVariableCosts(updated)
  }

  const calculateTotals = () => {
    const totalFixed = fixedCosts.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0)
    const totalVariable = variableCosts.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0)
    return { totalFixed, totalVariable }
  }

  const handleSubmit = async () => {
    console.log("[v0] ROI Dialog - Submit started")
    console.log("[v0] ROI Dialog - Service name:", serviceName)
    console.log("[v0] ROI Dialog - Practice ID:", practiceId)
    console.log("[v0] ROI Dialog - User ID:", userId)

    if (!serviceName.trim()) {
      console.error("[v0] ROI Dialog - Missing service name")
      alert("Bitte geben Sie einen Namen für die Leistung ein.")
      return
    }

    if (!practiceId) {
      console.error("[v0] ROI Dialog - Missing practice ID")
      alert("Keine Praxis ausgewählt. Bitte laden Sie die Seite neu.")
      return
    }

    setSaving(true)
    try {
      const { totalFixed, totalVariable } = calculateTotals()

      const payload = {
        practice_id: practiceId,
        user_id: userId,
        service_name: serviceName,
        description,
        fixed_costs: fixedCosts.filter((c) => c.name && c.amount > 0),
        variable_costs: variableCosts.filter((c) => c.name && c.amount > 0),
        total_fixed_costs: totalFixed,
        total_variable_costs: totalVariable,
        scenario_pessimistic: pricePessimistic,
        scenario_realistic: priceRealistic,
        scenario_optimistic: priceOptimistic,
        demand_pessimistic: demandPessimistic,
        demand_realistic: demandRealistic,
        demand_optimistic: demandOptimistic,
      }

      console.log("[v0] ROI Dialog - Sending payload:", payload)

      const response = await fetch("/api/roi-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("[v0] ROI Dialog - Response status:", response.status)
      const responseData = await response.json()
      console.log("[v0] ROI Dialog - Response data:", responseData)

      if (response.ok) {
        console.log("[v0] ROI Dialog - Analysis created successfully")
        onSuccess()
        resetForm()
      } else {
        const errorMessage = responseData.error || "Fehler beim Erstellen der Analyse"
        console.error("[v0] ROI Dialog - Analysis creation failed:", responseData)
        alert(errorMessage)
      }
    } catch (error) {
      console.error("[v0] ROI Dialog - Exception creating analysis:", error)
      alert("Fehler beim Erstellen der Analyse")
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setServiceName("")
    setDescription("")
    setFixedCosts([
      { name: "Anschaffung (Gerät, Software, Einrichtung)", amount: 0 },
      { name: "Schulungs-/Einarbeitungszeit", amount: 0 },
      { name: "Zertifikate / Kurse", amount: 0 },
      { name: "Marketing / Flyer / Webseite", amount: 0 },
      { name: "Implementierungsaufwand", amount: 0 },
    ])
    setVariableCosts([
      { name: "Materialkosten", amount: 0 },
      { name: "Arbeitszeit (inkl. MFA/Arzt-Zeit)", amount: 0 },
      { name: "Abrechnungskosten / Softwarekosten", amount: 0 },
      { name: "Verbrauchsmaterial", amount: 0 },
    ])
    setPricePessimistic(0)
    setPriceRealistic(0)
    setPriceOptimistic(0)
    setDemandPessimistic(0)
    setDemandRealistic(0)
    setDemandOptimistic(0)
  }

  const { totalFixed, totalVariable } = calculateTotals()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neue Lohnt-es-sich-Analyse</DialogTitle>
          <DialogDescription>
            Analysieren Sie die Wirtschaftlichkeit einer neuen Leistung oder Investition
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Grunddaten</TabsTrigger>
            <TabsTrigger value="fixed">Fixkosten</TabsTrigger>
            <TabsTrigger value="variable">Variable Kosten</TabsTrigger>
            <TabsTrigger value="scenarios">Szenarien</TabsTrigger>
          </TabsList>

          {/* Basic Info */}
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceName">Name der Leistung*</Label>
              <Input
                id="serviceName"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="z.B. Akupunktur, IGEL-Leistung, neue Geräteanschaffung"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optionale Beschreibung der Leistung oder Investition"
                rows={4}
              />
            </div>
          </TabsContent>

          {/* Fixed Costs */}
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

          {/* Variable Costs */}
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

          {/* Scenarios */}
          <TabsContent value="scenarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preis-Szenarien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="pricePessimistic"
                      className="font-semibold text-base px-2 py-1 bg-muted rounded-md inline-block"
                    >
                      Pessimistisch
                    </Label>
                    <div className="flex items-center gap-1">
                      <div className="relative flex-1">
                        <Input
                          id="pricePessimistic"
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
                    <Label
                      htmlFor="priceRealistic"
                      className="font-semibold text-base px-2 py-1 bg-muted rounded-md inline-block"
                    >
                      Realistisch
                    </Label>
                    <div className="flex items-center gap-1">
                      <div className="relative flex-1">
                        <Input
                          id="priceRealistic"
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
                    <Label
                      htmlFor="priceOptimistic"
                      className="font-semibold text-base px-2 py-1 bg-muted rounded-md inline-block"
                    >
                      Optimistisch
                    </Label>
                    <div className="flex items-center gap-1">
                      <div className="relative flex-1">
                        <Input
                          id="priceOptimistic"
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
                    <Label htmlFor="demandPessimistic">Pessimistisch</Label>
                    <Input
                      id="demandPessimistic"
                      type="number"
                      value={demandPessimistic}
                      onChange={(e) => setDemandPessimistic(Math.max(0, Number(e.target.value) || 0))}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demandRealistic">Realistisch</Label>
                    <Input
                      id="demandRealistic"
                      type="number"
                      value={demandRealistic}
                      onChange={(e) => setDemandRealistic(Math.max(0, Number(e.target.value) || 0))}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demandOptimistic">Optimistisch</Label>
                    <Input
                      id="demandOptimistic"
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Wird analysiert..." : "Analyse erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

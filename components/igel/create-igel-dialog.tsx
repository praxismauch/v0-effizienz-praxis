"use client"

import { useState } from "react"
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
import { Plus, Trash2, Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NettoBruttoCalculator } from "@/components/ui/netto-brutto-calculator"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { createIgelAnalysis } from "@/hooks/use-igel"

interface CreateIgelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Cost {
  name: string
  amount: number
  category?: string
}

interface PricingScenario {
  name: string
  price: number
  expected_monthly_demand: number
  notes: string
}

const IGEL_CATEGORIES = [
  "Check-up Premium",
  "Stoffwechsel / Lebensstil",
  "Hormonprofil",
  "Reisemedizin",
  "Infusionen / Aufbaukuren",
  "Ernährungsmedizin",
  "Sportmedizin",
  "Schlaf / Stressdiagnostik",
  "Sonstiges",
]

function CreateIgelDialog({ open, onOpenChange, onSuccess }: CreateIgelDialogProps) {
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()
  const user = currentUser; // Declare the user variable here

  const [serviceName, setServiceName] = useState("")
  const [serviceDescription, setServiceDescription] = useState("")
  const [category, setCategory] = useState("")

  const [oneTimeCosts, setOneTimeCosts] = useState<Cost[]>([
    { name: "Geräteanschaffung", amount: 0, category: "Equipment" },
  ])
  // State for time-based costs (MFA and Arzt)
  const [mfaMinutes, setMfaMinutes] = useState(0)
  const [mfaHourlyRate, setMfaHourlyRate] = useState(30) // Default hourly rate for MFA
  const [arztMinutes, setArztMinutes] = useState(0)
  const [arztHourlyRate, setArztHourlyRate] = useState(250) // Default hourly rate for Arzt
  const [roomMinutes, setRoomMinutes] = useState(0) // Room usage time in minutes
  const [roomHourlyRate, setRoomHourlyRate] = useState(50) // Default room cost per hour
  const [honorarGoal, setHonorarGoal] = useState(500) // Default goal for Honorarstundensatz

  const [variableCosts, setVariableCosts] = useState<Cost[]>([
    { name: "Materialkosten", amount: 0, category: "Material" },
  ])

  const [scenarios, setScenarios] = useState<PricingScenario[]>([
    {
      name: "Konservativ",
      price: 0,
      expected_monthly_demand: 0,
      notes: "",
    },
    {
      name: "Realistisch",
      price: 0,
      expected_monthly_demand: 0,
      notes: "",
    },
    {
      name: "Optimistisch",
      price: 0,
      expected_monthly_demand: 0,
      notes: "",
    },
  ])

  const addOneTimeCost = () => {
    setOneTimeCosts([...oneTimeCosts, { name: "", amount: 0 }])
  }

  const addVariableCost = () => {
    setVariableCosts([...variableCosts, { name: "", amount: 0 }])
  }

  const removeOneTimeCost = (index: number) => {
    setOneTimeCosts(oneTimeCosts.filter((_, i) => i !== index))
  }

  const removeVariableCost = (index: number) => {
    setVariableCosts(variableCosts.filter((_, i) => i !== index))
  }

  // Calculate labor and room costs from time inputs
  const calculateMfaCost = () => (mfaMinutes / 60) * mfaHourlyRate
  const calculateArztCost = () => (arztMinutes / 60) * arztHourlyRate
  const calculateRoomCost = () => (roomMinutes / 60) * roomHourlyRate
  
  // Calculate Honorarstundensatz: Price * 60 / arztMinutes
  const calculateHonorarStundensatz = (price: number) => {
    if (arztMinutes <= 0) return 0
    return (price * 60) / arztMinutes
  }

  const calculateTotals = () => {
    const totalOneTime = oneTimeCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0)
    const materialCosts = variableCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0)
    const laborCosts = calculateMfaCost() + calculateArztCost()
    const roomCosts = calculateRoomCost()
    const totalVariable = materialCosts + laborCosts + roomCosts
    return { totalOneTime, totalVariable, materialCosts, laborCosts, roomCosts }
  }

  const calculateBreakEven = (scenario: PricingScenario, totalOneTime: number, totalVariable: number) => {
    const profitPerService = scenario.price - totalVariable
    if (profitPerService <= 0) return Number.POSITIVE_INFINITY
    return Math.ceil(totalOneTime / profitPerService)
  }

  const handleAnalyze = async () => {
    // Only the "Realistisch" scenario (index 1) is required
    const realisticScenario = scenarios[1]
    if (!serviceName || !realisticScenario.price) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte Service-Name und Preis für das realistische Szenario angeben",
        variant: "destructive",
      })
      return
    }

    if (!currentPractice?.id) {
      toast({
        title: "Fehler",
        description: "Keine Praxis gefunden. Bitte laden Sie die Seite neu.",
        variant: "destructive",
      })
      return
    }

    setAnalyzing(true)

    try {
      const { totalOneTime, totalVariable } = calculateTotals()

      // Only include scenarios that have a price set
      const validScenarios = scenarios.filter((s) => s.price > 0)

      const scenarioAnalysis = validScenarios.map((scenario) => {
        const breakEven = calculateBreakEven(scenario, totalOneTime, totalVariable)
        const monthlyProfit = scenario.expected_monthly_demand * (scenario.price - totalVariable)
        const yearlyProfit = monthlyProfit * 12
        const roi = totalOneTime > 0 ? (yearlyProfit / totalOneTime) * 100 : 0
        const honorarStundensatz = calculateHonorarStundensatz(scenario.price)

        return {
          ...scenario,
          breakEven,
          monthlyProfit,
          yearlyProfit,
          roi,
          honorarStundensatz,
        }
      })

      const avgROI = scenarioAnalysis.reduce((sum, s) => sum + s.roi, 0) / validScenarios.length
      const avgBreakEven =
        scenarioAnalysis.reduce((sum, s) => sum + (s.breakEven === Number.POSITIVE_INFINITY ? 999 : s.breakEven), 0) /
        validScenarios.length

      let profitabilityScore = 50
      if (avgROI > 100) profitabilityScore += 30
      else if (avgROI > 50) profitabilityScore += 20
      else if (avgROI > 25) profitabilityScore += 10

      if (avgBreakEven < 10) profitabilityScore += 20
      else if (avgBreakEven < 25) profitabilityScore += 10
      else if (avgBreakEven < 50) profitabilityScore += 5

      profitabilityScore = Math.min(100, Math.max(0, profitabilityScore))

      let recommendation = "Nicht empfehlenswert"
      if (profitabilityScore >= 70) recommendation = "Sehr empfehlenswert"
      else if (profitabilityScore >= 40) recommendation = "Bedingt empfehlenswert"

      const aiResponse = await fetch("/api/igel/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_name: serviceName,
          service_description: serviceDescription,
          category,
          one_time_costs: oneTimeCosts,
          variable_costs: variableCosts,
          pricing_scenarios: scenarioAnalysis,
          profitability_score: profitabilityScore,
        }),
      })

      const aiData = await aiResponse.json()

      await createIgelAnalysis(currentPractice?.id, {
        created_by: currentUser?.id,
        service_name: serviceName,
        service_description: serviceDescription,
        category,
        one_time_costs: oneTimeCosts,
        variable_costs: [
          ...variableCosts,
          { name: "Arbeitszeit (MFA)", amount: calculateMfaCost(), category: "Labor", minutes: mfaMinutes, hourlyRate: mfaHourlyRate },
          { name: "Arztzeit", amount: calculateArztCost(), category: "Labor", minutes: arztMinutes, hourlyRate: arztHourlyRate },
        ],
        total_one_time_cost: totalOneTime,
        total_variable_cost: totalVariable,
        pricing_scenarios: scenarioAnalysis,
        ai_analysis: aiData.analysis,
        profitability_score: profitabilityScore,
        recommendation,
        break_even_point: Math.round(avgBreakEven),
        status: "analyzed",
        arzt_minutes: arztMinutes,
        honorar_goal: honorarGoal,
      })

      toast({
        title: "Analyse erfolgreich",
        description: `Die Selbstzahlerleistung "${serviceName}" wurde analysiert`,
      })

      onSuccess()
    } catch (error: any) {
      console.error("Error analyzing service:", error)
      toast({
        title: "Fehler",
        description: error.message || "Analyse fehlgeschlagen",
        variant: "destructive",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selbstzahlerleistung analysieren</DialogTitle>
          <DialogDescription>
            Analysieren Sie systematisch die Rentabilität einer Selbstzahlerleistung
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="service" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="service">Service</TabsTrigger>
            <TabsTrigger value="costs">Kosten</TabsTrigger>
            <TabsTrigger value="pricing">Preise</TabsTrigger>
          </TabsList>

          <TabsContent value="service" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceName">Service-Name *</Label>
              <Input
                id="serviceName"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="z.B. Großer Check-up Premium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {IGEL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                placeholder="Was beinhaltet diese Leistung?"
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="costs" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Fixkosten (einmalig)</h3>
                <Button type="button" variant="outline" size="sm" onClick={addOneTimeCost}>
                  <Plus className="mr-2 h-4 w-4" />
                  Hinzufügen
                </Button>
              </div>
              {oneTimeCosts.map((cost, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Kostenart (z.B. Geräteanschaffung)"
                    value={cost.name}
                    onChange={(e) => {
                      const updated = [...oneTimeCosts]
                      updated[index].name = e.target.value
                      setOneTimeCosts(updated)
                    }}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      placeholder="Betrag €"
                      value={cost.amount || ""}
                      onChange={(e) => {
                        const updated = [...oneTimeCosts]
                        updated[index].amount = Math.max(0, Number.parseFloat(e.target.value) || 0)
                        setOneTimeCosts(updated)
                      }}
                      className="w-32"
                      min="0"
                      step="0.01"
                    />
                    <NettoBruttoCalculator
                      onApply={(brutto) => {
                        const updated = [...oneTimeCosts]
                        updated[index].amount = Math.max(0, brutto)
                        setOneTimeCosts(updated)
                      }}
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeOneTimeCost(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <p className="text-sm font-medium">Gesamt: {calculateTotals().totalOneTime.toFixed(2)} €</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Variable Kosten (pro Leistung)</h3>
                <Button type="button" variant="outline" size="sm" onClick={addVariableCost}>
                  <Plus className="mr-2 h-4 w-4" />
                  Hinzufügen
                </Button>
              </div>
              {variableCosts.map((cost, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Kostenart (z.B. Material)"
                    value={cost.name}
                    onChange={(e) => {
                      const updated = [...variableCosts]
                      updated[index].name = e.target.value
                      setVariableCosts(updated)
                    }}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      placeholder="Betrag €"
                      value={cost.amount || ""}
                      onChange={(e) => {
                        const updated = [...variableCosts]
                        updated[index].amount = Math.max(0, Number.parseFloat(e.target.value) || 0)
                        setVariableCosts(updated)
                      }}
                      className="w-32"
                      min="0"
                      step="0.01"
                    />
                    <NettoBruttoCalculator
                      onApply={(brutto) => {
                        const updated = [...variableCosts]
                        updated[index].amount = Math.max(0, brutto)
                        setVariableCosts(updated)
                      }}
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeVariableCost(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* MFA Time Input */}
              <div className="flex gap-2 items-center">
                <span className="flex-1 text-sm font-medium">Arbeitszeit (MFA)</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Minuten"
                    value={mfaMinutes || ""}
                    onChange={(e) => setMfaMinutes(Math.max(0, Number.parseInt(e.target.value) || 0))}
                    className="w-24"
                    min="0"
                  />
                  <span className="text-sm text-muted-foreground">Min</span>
                  <Input
                    type="number"
                    placeholder="Stundensatz"
                    value={mfaHourlyRate || ""}
                    onChange={(e) => setMfaHourlyRate(Math.max(0, Number.parseFloat(e.target.value) || 0))}
                    className="w-24"
                    min="0"
                    step="0.01"
                  />
                  <span className="text-sm text-muted-foreground">€/Std</span>
                </div>
                <span className="w-24 text-right text-sm font-medium">{calculateMfaCost().toFixed(2)} €</span>
              </div>

              {/* Arzt Time Input */}
              <div className="flex gap-2 items-center">
                <span className="flex-1 text-sm font-medium">Arztzeit</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Minuten"
                    value={arztMinutes || ""}
                    onChange={(e) => setArztMinutes(Math.max(0, Number.parseInt(e.target.value) || 0))}
                    className="w-24"
                    min="0"
                  />
                  <span className="text-sm text-muted-foreground">Min</span>
                  <Input
                    type="number"
                    placeholder="Stundensatz"
                    value={arztHourlyRate || ""}
                    onChange={(e) => setArztHourlyRate(Math.max(0, Number.parseFloat(e.target.value) || 0))}
                    className="w-24"
                    min="0"
                    step="0.01"
                  />
                  <span className="text-sm text-muted-foreground">€/Std</span>
                </div>
                <span className="w-24 text-right text-sm font-medium">{calculateArztCost().toFixed(2)} €</span>
              </div>

              {/* Room Cost Input */}
              <div className="flex gap-2 items-center">
                <span className="flex-1 text-sm font-medium">Raumkosten</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Minuten"
                    value={roomMinutes || ""}
                    onChange={(e) => setRoomMinutes(Math.max(0, Number.parseInt(e.target.value) || 0))}
                    className="w-24"
                    min="0"
                  />
                  <span className="text-sm text-muted-foreground">Min</span>
                  <Input
                    type="number"
                    placeholder="Stundensatz"
                    value={roomHourlyRate || ""}
                    onChange={(e) => setRoomHourlyRate(Math.max(0, Number.parseFloat(e.target.value) || 0))}
                    className="w-24"
                    min="0"
                    step="0.01"
                  />
                  <span className="text-sm text-muted-foreground">€/Std</span>
                </div>
                <span className="w-24 text-right text-sm font-medium">{calculateRoomCost().toFixed(2)} €</span>
              </div>

              {/* Honorar Goal Input */}
              <div className="flex gap-2 items-center pt-2 border-t border-dashed">
                <span className="flex-1 text-sm font-medium">Ziel Honorarstundensatz (SZL)</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Ziel"
                    value={honorarGoal || ""}
                    onChange={(e) => setHonorarGoal(Math.max(0, Number.parseFloat(e.target.value) || 0))}
                    className="w-24"
                    min="0"
                    step="1"
                  />
                  <span className="text-sm text-muted-foreground">€/Std</span>
                </div>
              </div>

              <div className="pt-2 border-t space-y-1">
                <p className="text-sm text-muted-foreground">Materialkosten: {calculateTotals().materialCosts.toFixed(2)} €</p>
                <p className="text-sm text-muted-foreground">Personalkosten: {calculateTotals().laborCosts.toFixed(2)} €</p>
                <p className="text-sm text-muted-foreground">Raumkosten: {calculateTotals().roomCosts.toFixed(2)} €</p>
                <p className="text-sm font-medium">Gesamt: {calculateTotals().totalVariable.toFixed(2)} € pro Leistung</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            {scenarios.map((scenario, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <h3 className="font-semibold text-base px-3 py-1.5 bg-muted rounded-md inline-block">
                  {scenario.name}
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Preis pro Leistung (€) *</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={scenario.price || ""}
                        onChange={(e) => {
                          const updated = [...scenarios]
                          updated[index].price = Math.max(0, Number.parseFloat(e.target.value) || 0)
                          setScenarios(updated)
                        }}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      <NettoBruttoCalculator
                        onApply={(brutto) => {
                          const updated = [...scenarios]
                          updated[index].price = Math.max(0, brutto)
                          setScenarios(updated)
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Erwartete Nachfrage/Monat</Label>
                    <Input
                      type="number"
                      value={scenario.expected_monthly_demand || ""}
                      onChange={(e) => {
                        const updated = [...scenarios]
                        updated[index].expected_monthly_demand = Math.max(0, Number.parseInt(e.target.value) || 0)
                        setScenarios(updated)
                      }}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notizen</Label>
                  <Textarea
                    value={scenario.notes}
                    onChange={(e) => {
                      const updated = [...scenarios]
                      updated[index].notes = e.target.value
                      setScenarios(updated)
                    }}
                    placeholder="Begründung für diese Einschätzung"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleAnalyze} disabled={analyzing || !serviceName || !user}>
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analysiere...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                KI-Analyse starten
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { CreateIgelDialog }

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Loader2, Check } from "lucide-react"
import { usePractice } from "@/contexts/practice-context"

interface AIGoalGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGoalGenerated: (goalData: any) => void
}

export function AIGoalGeneratorDialog({ open, onOpenChange, onGoalGenerated }: AIGoalGeneratorDialogProps) {
  const { currentPractice } = usePractice()
  const [loading, setLoading] = useState(false)
  const [goalType, setGoalType] = useState<"practice" | "personal" | "team">("practice")
  const [context, setContext] = useState("")
  const [generatedGoals, setGeneratedGoals] = useState<any[]>([])
  const [selectedGoals, setSelectedGoals] = useState<Set<number>>(new Set())

  const handleGenerate = async () => {
    if (!currentPractice) return

    setLoading(true)
    setGeneratedGoals([])
    setSelectedGoals(new Set())

    try {
      const response = await fetch("/api/goals/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          practiceType: currentPractice.type,
          goalType,
          context,
        }),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Generieren der Ziele")
      }

      const data = await response.json()
      setGeneratedGoals(data.goals || [])
    } catch (error) {
      console.error("[v0] Error generating goals:", error)
      alert("Fehler beim Generieren der Ziele. Bitte versuchen Sie es erneut.")
    } finally {
      setLoading(false)
    }
  }

  const toggleGoalSelection = (index: number) => {
    const newSelected = new Set(selectedGoals)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedGoals(newSelected)
  }

  const handleUseGoals = () => {
    if (selectedGoals.size > 0) {
      selectedGoals.forEach((index) => {
        const goal = generatedGoals[index]
        if (goal) {
          onGoalGenerated({
            ...goal,
            goalType,
          })
        }
      })
      onOpenChange(false)
      setGeneratedGoals([])
      setSelectedGoals(new Set())
      setContext("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Ziel Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="goalType">Zielart</Label>
            <Select value={goalType} onValueChange={(value: any) => setGoalType(value)}>
              <SelectTrigger id="goalType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="practice">Praxisziel</SelectItem>
                <SelectItem value="team">Teamziel</SelectItem>
                <SelectItem value="personal">Persönliches Ziel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="context">Zusätzlicher Kontext (Optional)</Label>
            <Textarea
              id="context"
              placeholder="z.B. 'Wir möchten unsere Digitalisierung verbessern' oder 'Unser Team braucht mehr Weiterbildung'"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Geben Sie optionale Hinweise, um passendere Ziele zu generieren
            </p>
          </div>

          {generatedGoals.length === 0 && (
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ziele werden generiert...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  3-5 Ziele generieren
                </>
              )}
            </Button>
          )}

          {generatedGoals.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {generatedGoals.length} Ziele generiert. Wählen Sie die Ziele aus, die Sie verwenden möchten:
                </p>
                <Button onClick={handleGenerate} variant="outline" size="sm" disabled={loading}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Neu generieren
                </Button>
              </div>

              {generatedGoals.map((goal, index) => (
                <div
                  key={index}
                  onClick={() => toggleGoalSelection(index)}
                  className={`border rounded-lg p-5 space-y-4 cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 hover:shadow-md ${
                    selectedGoals.has(index)
                      ? "bg-primary/5 border-primary ring-2 ring-primary/20"
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-1 h-6 w-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selectedGoals.has(index) ? "bg-primary border-primary" : "border-muted-foreground"
                      }`}
                    >
                      {selectedGoals.has(index) && <Check className="h-4 w-4 text-primary-foreground" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{goal.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm ml-10 p-3 bg-background/50 rounded-lg">
                    <div>
                      <span className="text-muted-foreground block text-xs mb-1">Zielwert</span>
                      <span className="font-semibold">
                        {goal.targetValue} {goal.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs mb-1">Priorität</span>
                      <span className="font-semibold capitalize">{goal.priority}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs mb-1">Zieldatum</span>
                      <span className="font-semibold">
                        {new Date(goal.suggestedEndDate).toLocaleDateString("de-DE")}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t ml-10">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Begründung:</strong> {goal.reasoning}
                    </p>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <Button onClick={handleUseGoals} className="flex-1" disabled={selectedGoals.size === 0}>
                  {selectedGoals.size > 0
                    ? `${selectedGoals.size} ${selectedGoals.size === 1 ? "Ziel" : "Ziele"} verwenden`
                    : "Wählen Sie Ziele aus"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AIGoalGeneratorDialog

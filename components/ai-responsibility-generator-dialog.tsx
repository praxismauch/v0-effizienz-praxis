"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Loader2, Check } from "lucide-react"
import { usePractice } from "@/contexts/practice-context"

interface AIResponsibilityGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onResponsibilitiesGenerated: () => void
  teamSize?: number
}

export function AIResponsibilityGeneratorDialog({
  open,
  onOpenChange,
  onResponsibilitiesGenerated,
  teamSize,
}: AIResponsibilityGeneratorDialogProps) {
  const { currentPractice } = usePractice()
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState("")
  const [generatedResponsibilities, setGeneratedResponsibilities] = useState<any[]>([])
  const [selectedResponsibilities, setSelectedResponsibilities] = useState<Set<number>>(new Set())

  const handleGenerate = async () => {
    if (!currentPractice) return

    setLoading(true)
    setGeneratedResponsibilities([])
    setSelectedResponsibilities(new Set())

    try {
      const response = await fetch("/api/responsibilities/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          practiceType: currentPractice.type,
          teamSize,
          context,
        }),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Generieren der Zuständigkeiten")
      }

      const data = await response.json()
      setGeneratedResponsibilities(data.responsibilities || [])
    } catch (error) {
      console.error("[v0] Error generating responsibilities:", error)
      alert("Fehler beim Generieren der Zuständigkeiten. Bitte versuchen Sie es erneut.")
    } finally {
      setLoading(false)
    }
  }

  const toggleResponsibilitySelection = (index: number) => {
    const newSelected = new Set(selectedResponsibilities)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedResponsibilities(newSelected)
  }

  const handleUseResponsibilities = async () => {
    if (selectedResponsibilities.size > 0 && currentPractice?.id) {
      try {
        const promises = Array.from(selectedResponsibilities).map(async (index) => {
          const responsibility = generatedResponsibilities[index]
          if (responsibility) {
            const response = await fetch(`/api/practices/${currentPractice.id}/responsibilities`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: responsibility.name,
                description: responsibility.description,
                group_name: responsibility.group_name,
                responsible_user_id: null,
                deputy_user_id: null,
                team_member_ids: [],
                practice_id: currentPractice.id,
              }),
            })

            if (!response.ok) {
              throw new Error(`Failed to save responsibility: ${responsibility.name}`)
            }
          }
        })

        await Promise.all(promises)

        onResponsibilitiesGenerated()

        onOpenChange(false)
        setGeneratedResponsibilities([])
        setSelectedResponsibilities(new Set())
        setContext("")
      } catch (error) {
        console.error("[v0] Error saving responsibilities:", error)
        alert("Fehler beim Speichern der Zuständigkeiten. Bitte versuchen Sie es erneut.")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Zuständigkeiten Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="context">Zusätzlicher Kontext (Optional)</Label>
            <Textarea
              id="context"
              placeholder="z.B. 'Wir haben 5 Mitarbeiter' oder 'Wir brauchen Unterstützung bei der Abrechnung'"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Geben Sie optionale Hinweise, um passendere Zuständigkeiten zu generieren
            </p>
          </div>

          {generatedResponsibilities.length === 0 && (
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zuständigkeiten werden generiert...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  3-5 Zuständigkeiten generieren
                </>
              )}
            </Button>
          )}

          {generatedResponsibilities.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {generatedResponsibilities.length} Zuständigkeiten generiert. Wählen Sie aus, welche Sie verwenden
                  möchten:
                </p>
                <Button onClick={handleGenerate} variant="outline" size="sm" disabled={loading}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Neu generieren
                </Button>
              </div>

              {generatedResponsibilities.map((resp, index) => (
                <div
                  key={index}
                  onClick={() => toggleResponsibilitySelection(index)}
                  className={`border rounded-lg p-5 space-y-4 cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 hover:shadow-md ${
                    selectedResponsibilities.has(index)
                      ? "bg-primary/5 border-primary ring-2 ring-primary/20"
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-1 h-6 w-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selectedResponsibilities.has(index) ? "bg-primary border-primary" : "border-muted-foreground"
                      }`}
                    >
                      {selectedResponsibilities.has(index) && <Check className="h-4 w-4 text-primary-foreground" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{resp.name}</h4>
                        <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-medium">
                          {resp.group_name}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{resp.description}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t ml-10">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Begründung:</strong> {resp.reasoning}
                    </p>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleUseResponsibilities}
                  className="flex-1"
                  disabled={selectedResponsibilities.size === 0}
                >
                  {selectedResponsibilities.size > 0
                    ? `${selectedResponsibilities.size} ${selectedResponsibilities.size === 1 ? "Zuständigkeit" : "Zuständigkeiten"} verwenden`
                    : "Wählen Sie Zuständigkeiten aus"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { AIResponsibilityGeneratorDialog as AiResponsibilityGeneratorDialog }

export default AIResponsibilityGeneratorDialog

"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import { Sparkles, Loader2 } from "lucide-react"

interface AIResponsibilityGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onResponsibilitiesGenerated: () => void
}

export function AIResponsibilityGeneratorDialog({
  open,
  onOpenChange,
  onResponsibilitiesGenerated,
}: AIResponsibilityGeneratorDialogProps) {
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [generating, setGenerating] = useState(false)
  const [practiceType, setPracticeType] = useState("")
  const [teamSize, setTeamSize] = useState("")
  const [additionalContext, setAdditionalContext] = useState("")

  const handleGenerate = async () => {
    if (!currentPractice?.id) {
      toast({
        title: "Fehler",
        description: "Keine Praxis ausgewählt",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/responsibilities/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceType,
          teamSize: Number.parseInt(teamSize) || null,
          additionalContext,
        }),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Generieren der Zuständigkeiten")
      }

      const data = await response.json()

      toast({
        title: "Erfolg",
        description: `${data.count || 0} Zuständigkeiten wurden erstellt`,
      })

      onOpenChange(false)
      onResponsibilitiesGenerated()

      // Reset form
      setPracticeType("")
      setTeamSize("")
      setAdditionalContext("")
    } catch (error) {
      console.error("[v0] Error generating responsibilities:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Zuständigkeiten konnten nicht generiert werden",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-generierte Zuständigkeiten
          </DialogTitle>
          <DialogDescription>
            Lassen Sie die KI automatisch passende Zuständigkeiten für Ihre Praxis erstellen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="practiceType">Praxistyp</Label>
            <Select value={practiceType} onValueChange={setPracticeType}>
              <SelectTrigger id="practiceType">
                <SelectValue placeholder="Praxistyp auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hausarzt">Hausarztpraxis</SelectItem>
                <SelectItem value="facharzt">Facharztpraxis</SelectItem>
                <SelectItem value="zahnarzt">Zahnarztpraxis</SelectItem>
                <SelectItem value="physiotherapie">Physiotherapie</SelectItem>
                <SelectItem value="psychotherapie">Psychotherapie</SelectItem>
                <SelectItem value="mvz">MVZ (Medizinisches Versorgungszentrum)</SelectItem>
                <SelectItem value="other">Sonstige</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="teamSize">Teamgröße (optional)</Label>
            <Select value={teamSize} onValueChange={setTeamSize}>
              <SelectTrigger id="teamSize">
                <SelectValue placeholder="Teamgröße auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-5">1-5 Mitarbeiter</SelectItem>
                <SelectItem value="6-10">6-10 Mitarbeiter</SelectItem>
                <SelectItem value="11-20">11-20 Mitarbeiter</SelectItem>
                <SelectItem value="21-50">21-50 Mitarbeiter</SelectItem>
                <SelectItem value="50+">Mehr als 50 Mitarbeiter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="context">Zusätzlicher Kontext (optional)</Label>
            <Textarea
              id="context"
              placeholder="z.B. Wir bieten spezielle Sprechstunden an, haben ein Labor vor Ort, etc."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={4}
            />
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-1">Hinweis:</p>
            <p>
              Die KI erstellt auf Basis Ihrer Angaben passende Zuständigkeiten. Sie können diese danach beliebig
              anpassen, löschen oder erweitern.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Abbrechen
          </Button>
          <Button onClick={handleGenerate} disabled={generating || !practiceType}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generieren
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

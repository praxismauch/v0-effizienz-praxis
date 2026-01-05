"use client"

import { useState } from "react"
import { Loader2, MapPin, Briefcase, Search, Sparkles, Brain, CheckCircle2, BarChart3, FileText } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface CreateCompetitorAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const SPECIALTIES = [
  "Allgemeinmedizin",
  "Innere Medizin",
  "Kardiologie",
  "Dermatologie",
  "Orthopädie",
  "Gynäkologie",
  "Urologie",
  "HNO",
  "Augenheilkunde",
  "Neurologie",
  "Psychiatrie",
  "Psychotherapie",
  "Kinderheilkunde",
  "Chirurgie",
  "Radiologie",
  "Zahnmedizin",
  "Kieferorthopädie",
  "Physiotherapie",
  "Hausarztpraxis",
  "MVZ",
]

export function CreateCompetitorAnalysisDialog({ open, onOpenChange, onSuccess }: CreateCompetitorAnalysisDialogProps) {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState<string>("")

  const [formData, setFormData] = useState({
    location: "",
    specialty: "",
    radius_km: 10,
    additional_keywords: "",
    title: "",
  })

  const handleSubmit = async (generateNow: boolean) => {
    if (!formData.location.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Ort / Region ein",
        variant: "destructive",
      })
      return
    }

    if (!formData.specialty) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Fachrichtung aus",
        variant: "destructive",
      })
      return
    }

    if (!currentPractice?.id) {
      toast({
        title: "Fehler",
        description: "Keine Praxis ausgewählt",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    if (generateNow) {
      setGenerating(true)
      setGenerationStep("Erstelle Analyse...")
    }

    try {
      // Create the analysis
      const createResponse = await fetch(`/api/practices/${currentPractice.id}/competitor-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          created_by: currentUser?.id,
          additional_keywords: formData.additional_keywords
            ? formData.additional_keywords.split(",").map((k) => k.trim())
            : [],
          title: formData.title || `Konkurrenzanalyse ${formData.location} - ${formData.specialty}`,
        }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create analysis")
      }

      const analysis = await createResponse.json()

      if (generateNow) {
        setGenerationStep("Analysiere Wettbewerber...")

        // Start generating
        const generateResponse = await fetch(
          `/api/practices/${currentPractice.id}/competitor-analysis/${analysis.id}/generate`,
          { method: "POST" },
        )

        if (!generateResponse.ok) {
          toast({
            title: "Warnung",
            description: "Analyse erstellt, aber Generierung fehlgeschlagen. Versuchen Sie es später erneut.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Erfolg",
            description: "Konkurrenzanalyse wurde erstellt und generiert",
          })
        }
      } else {
        toast({
          title: "Erfolg",
          description: "Konkurrenzanalyse wurde als Entwurf gespeichert",
        })
      }

      // Reset form
      setFormData({
        location: "",
        specialty: "",
        radius_km: 10,
        additional_keywords: "",
        title: "",
      })

      onSuccess()
    } catch (error) {
      console.error("Error creating competitor analysis:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Analyse konnte nicht erstellt werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setGenerating(false)
      setGenerationStep("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {generating && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping">
                  <Brain className="h-16 w-16 text-primary/30" />
                </div>
                <Brain className="h-16 w-16 text-primary animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">KI erstellt Konkurrenzanalyse</h3>
                <p className="text-muted-foreground">{generationStep || "Bitte warten..."}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Dies kann bis zu einer Minute dauern...</span>
              </div>
              {/* Generation steps indicator */}
              <div className="mt-4 space-y-2 text-left w-full max-w-xs">
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    generationStep.includes("Erstelle") ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {generationStep.includes("Erstelle") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>Analyse erstellen</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    generationStep.includes("Wettbewerber") ? "text-primary" : "text-muted-foreground/50",
                  )}
                >
                  {generationStep.includes("Wettbewerber") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span>Wettbewerber identifizieren</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    generationStep.includes("SWOT") ? "text-primary" : "text-muted-foreground/50",
                  )}
                >
                  {generationStep.includes("SWOT") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4" />
                  )}
                  <span>SWOT-Analyse durchführen</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    generationStep.includes("Empfehlungen") ? "text-primary" : "text-muted-foreground/50",
                  )}
                >
                  {generationStep.includes("Empfehlungen") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span>Empfehlungen generieren</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Neue Konkurrenzanalyse erstellen
          </DialogTitle>
          <DialogDescription>
            Geben Sie Ihre Suchkriterien ein. Die KI analysiert automatisch Ihre Wettbewerber und erstellt einen
            detaillierten Bericht.
          </DialogDescription>
        </DialogHeader>

        {/* ... existing code for form fields ... */}
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Ort / Region *
              </Label>
              <Input
                id="location"
                placeholder="z.B. München, Hamburg-Eppendorf"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty" className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                Fachrichtung *
              </Label>
              <Select
                value={formData.specialty}
                onValueChange={(value) => setFormData({ ...formData, specialty: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fachrichtung wählen" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="radius">Suchradius (km)</Label>
              <Select
                value={formData.radius_km.toString()}
                onValueChange={(value) => setFormData({ ...formData, radius_km: Number.parseInt(value) })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 km</SelectItem>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="15">15 km</SelectItem>
                  <SelectItem value="20">20 km</SelectItem>
                  <SelectItem value="30">30 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Titel (optional)</Label>
              <Input
                id="title"
                placeholder="z.B. Marktanalyse Q1 2024"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Zusätzliche Keywords (optional)</Label>
            <Textarea
              id="keywords"
              placeholder="z.B. IGeL-Leistungen, Privatpatienten, Sportmedizin (kommagetrennt)"
              value={formData.additional_keywords}
              onChange={(e) => setFormData({ ...formData, additional_keywords: e.target.value })}
              rows={2}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">Trennen Sie mehrere Keywords mit Kommas</p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Was wird analysiert?</h4>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
              <li>• Identifikation von Wettbewerbern in Ihrer Region</li>
              <li>• Stärken- und Schwächenanalyse</li>
              <li>• Marktchancen und Risiken (SWOT)</li>
              <li>• Preisvergleich für IGeL-Leistungen</li>
              <li>• Online-Präsenz und Bewertungsanalyse</li>
              <li>• Strategische Handlungsempfehlungen</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Abbrechen
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit(false)}
            disabled={loading || !formData.location.trim() || !formData.specialty}
          >
            Als Entwurf speichern
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={loading || !formData.location.trim() || !formData.specialty}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird generiert...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Mit KI erstellen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateCompetitorAnalysisDialog

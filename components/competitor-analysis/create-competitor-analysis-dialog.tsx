"use client"

import { useState, useEffect } from "react"
import { Loader2, MapPin, Briefcase, Search, Sparkles, Brain, CheckCircle2, BarChart3, FileText, X, Check, ChevronsUpDown } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
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
  const [specialtyOpen, setSpecialtyOpen] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // Parse practice data for defaults
  const practiceCity = (() => {
    if (!currentPractice) return ""
    const addr = (currentPractice as any).address || ""
    const parts = addr.split(", ")
    // address format: "street, city, zip" or "street, zip city"
    return parts[1] || ""
  })()

  const practiceSpecializations = (() => {
    if (!currentPractice) return [] as string[]
    const raw = (currentPractice as any).specialization || ""
    return raw
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean)
  })()

  const [formData, setFormData] = useState({
    location: "",
    specialties: [] as string[],
    radius_km: 10,
    additional_keywords: "",
    title: "",
  })

  // Pre-fill defaults from practice settings when dialog opens
  useEffect(() => {
    if (open && currentPractice) {
      setFormData((prev) => ({
        ...prev,
        location: prev.location || practiceCity,
        specialties: prev.specialties.length === 0 ? practiceSpecializations : prev.specialties,
      }))
    }
  }, [open, currentPractice])

  const handleSubmit = async (generateNow: boolean) => {
    if (!formData.location.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Ort / Region ein",
        variant: "destructive",
      })
      return
    }

    if (formData.specialties.length === 0) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie mindestens eine Fachrichtung aus",
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

    const controller = new AbortController()
    setAbortController(controller)
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
        signal: controller.signal,
        body: JSON.stringify({
          location: formData.location,
          specialty: formData.specialties.join(", "),
          radius_km: formData.radius_km,
          created_by: currentUser?.id,
          additional_keywords: formData.additional_keywords
            ? formData.additional_keywords.split(",").map((k) => k.trim())
            : [],
          title: formData.title || `Konkurrenzanalyse ${formData.location} - ${formData.specialties.join(", ")}`,
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
          { method: "POST", signal: controller.signal },
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

          // Auto-generate cover image in background (non-blocking)
          setGenerationStep("Erstelle Titelbild...")
          fetch(`/api/practices/${currentPractice.id}/competitor-analysis/generate-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              analysisId: analysis.id,
              location: formData.location,
              specialty: formData.specialties.join(", "),
            }),
          }).catch(() => {
            // Image generation is non-critical, ignore errors
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
        location: practiceCity,
        specialties: practiceSpecializations,
        radius_km: 10,
        additional_keywords: "",
        title: "",
      })

      onSuccess()
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        toast({
          title: "Abgebrochen",
          description: "Die Analyse-Erstellung wurde abgebrochen.",
        })
      } else {
        console.error("Error creating competitor analysis:", error)
        toast({
          title: "Fehler",
          description: error instanceof Error ? error.message : "Analyse konnte nicht erstellt werden",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
      setGenerating(false)
      setGenerationStep("")
      setAbortController(null)
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
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  abortController?.abort()
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Abbrechen
              </Button>
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
              <Label className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                Fachrichtung *
              </Label>
              <Popover open={specialtyOpen} onOpenChange={setSpecialtyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={specialtyOpen}
                    className="w-full justify-between font-normal h-auto min-h-10"
                    disabled={loading}
                  >
                    {formData.specialties.length > 0 ? (
                      <span className="flex flex-wrap gap-1">
                        {formData.specialties.map((spec) => (
                          <Badge key={spec} variant="secondary" className="text-xs">
                            {spec}
                            <button
                              type="button"
                              className="ml-1 rounded-full hover:bg-destructive/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormData({
                                  ...formData,
                                  specialties: formData.specialties.filter((s) => s !== spec),
                                })
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Fachrichtungen wählen...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                    {practiceSpecializations.length > 0 && (
                      <>
                        <p className="text-xs font-medium text-muted-foreground px-2 py-1">Praxis-Fachrichtungen</p>
                        {practiceSpecializations.map((spec: string) => (
                          <label
                            key={`practice-${spec}`}
                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
                          >
                            <Checkbox
                              checked={formData.specialties.includes(spec)}
                              onCheckedChange={(checked) => {
                                setFormData({
                                  ...formData,
                                  specialties: checked
                                    ? [...formData.specialties, spec]
                                    : formData.specialties.filter((s) => s !== spec),
                                })
                              }}
                            />
                            <span className="font-medium">{spec}</span>
                          </label>
                        ))}
                        <div className="border-t my-1" />
                        <p className="text-xs font-medium text-muted-foreground px-2 py-1">Weitere Fachrichtungen</p>
                      </>
                    )}
                    {SPECIALTIES.filter((s) => !practiceSpecializations.includes(s)).map((spec) => (
                      <label
                        key={spec}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={formData.specialties.includes(spec)}
                          onCheckedChange={(checked) => {
                            setFormData({
                              ...formData,
                              specialties: checked
                                ? [...formData.specialties, spec]
                                : formData.specialties.filter((s) => s !== spec),
                            })
                          }}
                        />
                        {spec}
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
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
            disabled={loading || !formData.location.trim() || formData.specialties.length === 0}
          >
            Als Entwurf speichern
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={loading || !formData.location.trim() || formData.specialties.length === 0}
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

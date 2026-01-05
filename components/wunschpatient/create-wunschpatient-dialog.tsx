"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Sparkles, ImageIcon, Brain, Wand2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateWunschpatientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  practiceId: string
  userId: string
}

const healthConcernOptions = [
  "Rückenschmerzen",
  "Kopfschmerzen/Migräne",
  "Stress/Burnout",
  "Übergewicht",
  "Diabetes",
  "Herzerkrankungen",
  "Allergien",
  "Hautprobleme",
  "Schlafstörungen",
  "Verdauungsprobleme",
  "Gelenkschmerzen",
  "Immunschwäche",
]

const lifestyleOptions = [
  "Sportlich aktiv",
  "Gesunde Ernährung",
  "Stressiger Beruf",
  "Familie mit Kindern",
  "Raucher",
  "Wenig Bewegung",
  "Viel Reisen",
  "Home Office",
  "Schichtarbeit",
  "Hohe Arbeitsbelastung",
]

const valueOptions = [
  "Vertrauen",
  "Erreichbarkeit",
  "Moderne Ausstattung",
  "Persönliche Beziehung",
  "Effizienz",
  "Ganzheitliche Betreuung",
  "Digitale Services",
  "Kurze Wartezeiten",
  "Transparenz",
  "Nachhaltigkeit",
]

const expectationOptions = [
  "Ausreichend Zeit beim Arzt",
  "Empathische Betreuung",
  "High-Tech Diagnostik",
  "Schnelle Terminvergabe",
  "Online-Terminbuchung",
  "Digitale Befunde",
  "Telemedizin",
  "Präventive Beratung",
  "Ganzheitlicher Ansatz",
  "Second Opinion",
]

export function CreateWunschpatientDialog({
  open,
  onOpenChange,
  onSuccess,
  practiceId,
  userId,
}: CreateWunschpatientDialogProps) {
  const [currentTab, setCurrentTab] = useState("demografie")
  const [loading, setLoading] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatingProfile, setGeneratingProfile] = useState(false)
  const [generationStep, setGenerationStep] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    age_range: "",
    gender: "",
    occupation: "",
    family_status: "",
    archetype: "",
    health_concerns: [] as string[],
    lifestyle_factors: [] as string[],
    values: [] as string[],
    expectations: [] as string[],
    health_consciousness: "",
    prevention_vs_acute: "",
    communication_preference: "",
    financial_willingness: "",
    location_area: "",
    transport_method: "",
    services_interested: "",
  })

  const handleCheckboxChange = (
    field: "health_concerns" | "lifestyle_factors" | "values" | "expectations",
    value: string,
    checked: boolean,
  ) => {
    if (checked) {
      setFormData({ ...formData, [field]: [...formData[field], value] })
    } else {
      setFormData({ ...formData, [field]: formData[field].filter((v) => v !== value) })
    }
  }

  const generatePatientImage = async (profileId: string) => {
    setGeneratingImage(true)
    try {
      const response = await fetch("/api/wunschpatient/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          gender: formData.gender,
          age_range: formData.age_range,
          occupation: formData.occupation,
          archetype: formData.archetype,
          lifestyle_factors: formData.lifestyle_factors,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Patientenbild generiert",
          description: "Das KI-generierte Bild wurde erfolgreich erstellt.",
        })
        return data.imageUrl
      } else {
        console.error("Failed to generate image")
        toast({
          title: "Bild konnte nicht generiert werden",
          description: "Das Profil wurde trotzdem gespeichert.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error generating image:", err)
    } finally {
      setGeneratingImage(false)
    }
    return null
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name || !formData.age_range || !formData.gender || !formData.archetype) {
      setError("Bitte füllen Sie alle Pflichtfelder aus (Name, Alter, Geschlecht, Archetyp)")
      return
    }

    if (!userId) {
      setError("Benutzer-ID fehlt. Bitte laden Sie die Seite neu.")
      return
    }

    setLoading(true)
    setError(null)
    setGeneratingProfile(true)
    setGenerationStep("Analysiere Eingaben...")

    try {
      setGenerationStep("KI generiert Persona-Beschreibung...")

      // First generate AI profile content
      const generateResponse = await fetch("/api/wunschpatient/generate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      let aiContent = {
        persona_description: "",
        marketing_strategy: "",
        communication_tips: "",
        service_recommendations: [] as string[],
      }

      if (generateResponse.ok) {
        aiContent = await generateResponse.json()
      }

      setGenerationStep("Speichere Profil...")
      setGeneratingProfile(false)

      // Then save the profile
      const saveResponse = await fetch("/api/wunschpatient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          services_interested: formData.services_interested
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          ...aiContent,
          practice_id: practiceId,
          created_by: userId,
        }),
      })

      if (saveResponse.ok) {
        const savedProfile = await saveResponse.json()

        if (savedProfile.id) {
          setGenerationStep("Generiere Profilbild...")
          await generatePatientImage(savedProfile.id)
        }

        setFormData({
          name: "",
          age_range: "",
          gender: "",
          occupation: "",
          family_status: "",
          archetype: "",
          health_concerns: [],
          lifestyle_factors: [],
          values: [],
          expectations: [],
          health_consciousness: "",
          prevention_vs_acute: "",
          communication_preference: "",
          financial_willingness: "",
          location_area: "",
          transport_method: "",
          services_interested: "",
        })
        setCurrentTab("demografie")
        onSuccess()
      } else {
        const errorData = await saveResponse.json().catch(() => ({}))
        setError(errorData.error || "Fehler beim Speichern des Profils")
      }
    } catch (err) {
      console.error("Error creating profile:", err)
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.")
    } finally {
      setLoading(false)
      setGeneratingProfile(false)
      setGenerationStep("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto relative">
        {(generatingProfile || generatingImage) && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping">
                  <Brain className="h-16 w-16 text-primary/30" />
                </div>
                <Brain className="h-16 w-16 text-primary animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">KI generiert Wunschpatienten-Profil</h3>
                <p className="text-muted-foreground">{generationStep || "Bitte warten..."}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Dies kann einige Sekunden dauern...</span>
              </div>
              <div className="mt-4 space-y-2 text-left w-full max-w-xs">
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    generationStep.includes("Analysiere") ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {generationStep.includes("Analysiere") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>Eingaben analysieren</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    generationStep.includes("Persona")
                      ? "text-primary"
                      : generationStep.includes("Speichere") || generationStep.includes("Profilbild")
                        ? "text-muted-foreground"
                        : "text-muted-foreground/50",
                  )}
                >
                  {generationStep.includes("Persona") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : generationStep.includes("Speichere") || generationStep.includes("Profilbild") ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  <span>Persona & Strategie generieren</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    generationStep.includes("Speichere")
                      ? "text-primary"
                      : generationStep.includes("Profilbild")
                        ? "text-muted-foreground"
                        : "text-muted-foreground/50",
                  )}
                >
                  {generationStep.includes("Speichere") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : generationStep.includes("Profilbild") ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  <span>Profil speichern</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    generatingImage ? "text-primary" : "text-muted-foreground/50",
                  )}
                >
                  {generatingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  <span>Profilbild generieren</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Neuen Wunschpatienten erstellen
          </DialogTitle>
          <DialogDescription>
            Definieren Sie die Merkmale Ihres idealen Patienten. Die KI generiert automatisch ein detailliertes Profil
            mit Marketingstrategie und einem photorealistischen Patientenbild.
          </DialogDescription>
        </DialogHeader>

        {error && <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">{error}</div>}

        {generatingImage && (
          <div className="bg-primary/10 text-primary px-4 py-3 rounded-md text-sm flex items-center gap-2">
            <ImageIcon className="h-4 w-4 animate-pulse" />
            <span>KI generiert ein photorealistisches Patientenbild...</span>
          </div>
        )}

        <div className="max-h-[60vh] pr-4 overflow-y-auto">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="demografie">Demografie</TabsTrigger>
              <TabsTrigger value="gesundheit">Gesundheit</TabsTrigger>
              <TabsTrigger value="verhalten">Verhalten</TabsTrigger>
              <TabsTrigger value="werte">Werte</TabsTrigger>
            </TabsList>

            <TabsContent value="demografie" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Profilname *</Label>
                  <Input
                    id="name"
                    placeholder="z.B. Gesundheitsbewusster Berufstätiger"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age_range">Altersspanne *</Label>
                  <Select
                    value={formData.age_range}
                    onValueChange={(value) => setFormData({ ...formData, age_range: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alter wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18-25">18-25 Jahre</SelectItem>
                      <SelectItem value="26-35">26-35 Jahre</SelectItem>
                      <SelectItem value="36-45">36-45 Jahre</SelectItem>
                      <SelectItem value="46-55">46-55 Jahre</SelectItem>
                      <SelectItem value="56-65">56-65 Jahre</SelectItem>
                      <SelectItem value="65+">65+ Jahre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Geschlecht *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Geschlecht wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Männlich</SelectItem>
                      <SelectItem value="female">Weiblich</SelectItem>
                      <SelectItem value="diverse">Divers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Beruf</Label>
                  <Input
                    id="occupation"
                    placeholder="z.B. Manager, Lehrer, Selbstständig"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="family_status">Familienstatus</Label>
                  <Select
                    value={formData.family_status}
                    onValueChange={(value) => setFormData({ ...formData, family_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="partnership">In Partnerschaft</SelectItem>
                      <SelectItem value="married">Verheiratet</SelectItem>
                      <SelectItem value="married_children">Verheiratet mit Kindern</SelectItem>
                      <SelectItem value="single_parent">Alleinerziehend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_area">Wohngebiet</Label>
                  <Input
                    id="location_area"
                    placeholder="z.B. Stadtzentrum, Vorort, Ländlich"
                    value={formData.location_area}
                    onChange={(e) => setFormData({ ...formData, location_area: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="archetype">Patienten-Archetyp *</Label>
                <Select
                  value={formData.archetype}
                  onValueChange={(value) => setFormData({ ...formData, archetype: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Archetyp wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prevention">Der Präventionsorientierte</SelectItem>
                    <SelectItem value="chronic">Der chronische Patient</SelectItem>
                    <SelectItem value="performance">Der Leistungsorientierte (Sport, Business, Biohacker)</SelectItem>
                    <SelectItem value="acute">Der Akut-Patient (schnelle Hilfe)</SelectItem>
                    <SelectItem value="relationship">Der Beziehungstyp (feste Bindung)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="gesundheit" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Gesundheitsthemen / Beschwerden</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Welche gesundheitlichen Themen sind für diesen Patienten relevant?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {healthConcernOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`health-${option}`}
                          checked={formData.health_concerns.includes(option)}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange("health_concerns", option, checked as boolean)
                          }
                        />
                        <label htmlFor={`health-${option}`} className="text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gesundheitsbewusstsein</Label>
                    <Select
                      value={formData.health_consciousness}
                      onValueChange={(value) => setFormData({ ...formData, health_consciousness: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="very_high">Sehr hoch (aktiv, informiert)</SelectItem>
                        <SelectItem value="high">Hoch (interessiert)</SelectItem>
                        <SelectItem value="medium">Mittel (bei Bedarf)</SelectItem>
                        <SelectItem value="low">Niedrig (passiv)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prävention vs. Akutmedizin</Label>
                    <Select
                      value={formData.prevention_vs_acute}
                      onValueChange={(value) => setFormData({ ...formData, prevention_vs_acute: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prevention_focused">Stark präventionsorientiert</SelectItem>
                        <SelectItem value="balanced">Ausgeglichen</SelectItem>
                        <SelectItem value="acute_focused">Primär bei Beschwerden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Interessante Leistungen</Label>
                  <Textarea
                    placeholder="z.B. Check-ups, Vorsorge, Coaching, Naturheilkunde (kommagetrennt)"
                    value={formData.services_interested}
                    onChange={(e) => setFormData({ ...formData, services_interested: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="verhalten" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Lebensstil-Faktoren</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Welche Lebensstil-Merkmale treffen auf diesen Patienten zu?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {lifestyleOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lifestyle-${option}`}
                          checked={formData.lifestyle_factors.includes(option)}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange("lifestyle_factors", option, checked as boolean)
                          }
                        />
                        <label htmlFor={`lifestyle-${option}`} className="text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bevorzugte Kommunikation</Label>
                    <Select
                      value={formData.communication_preference}
                      onValueChange={(value) => setFormData({ ...formData, communication_preference: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="digital">Digital (App, E-Mail, Chat)</SelectItem>
                        <SelectItem value="phone">Telefon</SelectItem>
                        <SelectItem value="in_person">Persönlich vor Ort</SelectItem>
                        <SelectItem value="mixed">Gemischt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Transportmittel zur Praxis</Label>
                    <Input
                      placeholder="z.B. Auto, ÖPNV, Fahrrad"
                      value={formData.transport_method}
                      onChange={(e) => setFormData({ ...formData, transport_method: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Finanzielle Bereitschaft für IGeL</Label>
                  <Select
                    value={formData.financial_willingness}
                    onValueChange={(value) => setFormData({ ...formData, financial_willingness: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very_high">Sehr hoch (investiert gerne in Gesundheit)</SelectItem>
                      <SelectItem value="high">Hoch (bei klarem Nutzen)</SelectItem>
                      <SelectItem value="medium">Mittel (selektiv)</SelectItem>
                      <SelectItem value="low">Niedrig (primär Kassenleistungen)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="werte" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Wichtige Werte</Label>
                  <p className="text-sm text-muted-foreground mb-3">Was ist diesem Patienten besonders wichtig?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {valueOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`value-${option}`}
                          checked={formData.values.includes(option)}
                          onCheckedChange={(checked) => handleCheckboxChange("values", option, checked as boolean)}
                        />
                        <label htmlFor={`value-${option}`} className="text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base">Erwartungen an die Praxis</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Welche Erwartungen hat dieser Patient an Ihre Praxis?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {expectationOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`expectation-${option}`}
                          checked={formData.expectations.includes(option)}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange("expectations", option, checked as boolean)
                          }
                        />
                        <label htmlFor={`expectation-${option}`} className="text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading || generatingImage}>
            Abbrechen
          </Button>
          <div className="flex gap-2">
            {currentTab !== "demografie" && (
              <Button
                variant="outline"
                onClick={() => {
                  const tabs = ["demografie", "gesundheit", "verhalten", "werte"]
                  const currentIndex = tabs.indexOf(currentTab)
                  if (currentIndex > 0) {
                    setCurrentTab(tabs[currentIndex - 1])
                  }
                }}
                disabled={loading || generatingImage}
              >
                Zurück
              </Button>
            )}
            {currentTab !== "werte" ? (
              <Button
                onClick={() => {
                  const tabs = ["demografie", "gesundheit", "verhalten", "werte"]
                  const currentIndex = tabs.indexOf(currentTab)
                  if (currentIndex < tabs.length - 1) {
                    setCurrentTab(tabs[currentIndex + 1])
                  }
                }}
              >
                Weiter
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading || generatingImage}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird erstellt...
                  </>
                ) : generatingImage ? (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4 animate-pulse" />
                    Bild wird generiert...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Profil erstellen
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateWunschpatientDialog

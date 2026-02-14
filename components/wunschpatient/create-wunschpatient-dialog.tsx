"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Sparkles, ImageIcon } from "lucide-react"
import { TABS, EMPTY_FORM, type WunschpatientFormData } from "./constants"
import { GenerationOverlay } from "./generation-overlay"
import { DemografieTab, GesundheitTab, VerhaltenTab, WerteTab } from "./form-tabs"

interface CreateWunschpatientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  practiceId: string
  userId: string
}

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
  const [generationStep, setGenerationStep] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<WunschpatientFormData>({ ...EMPTY_FORM })
  const { toast } = useToast()

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
        toast({ title: "Patientenbild generiert", description: "Das KI-generierte Bild wurde erfolgreich erstellt." })
        return data.imageUrl
      }
      toast({ title: "Bild konnte nicht generiert werden", description: "Das Profil wurde trotzdem gespeichert.", variant: "destructive" })
    } catch (err) {
      console.error("Error generating image:", err)
    } finally {
      setGeneratingImage(false)
    }
    return null
  }

  const handleSubmit = async () => {
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
      const generateResponse = await fetch("/api/wunschpatient/generate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      let aiContent = { persona_description: "", marketing_strategy: "", communication_tips: "", service_recommendations: [] as string[] }
      if (generateResponse.ok) aiContent = await generateResponse.json()

      setGenerationStep("Speichere Profil...")
      setGeneratingProfile(false)

      const saveResponse = await fetch("/api/wunschpatient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          services_interested: formData.services_interested.split(",").map((s) => s.trim()).filter(Boolean),
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
        setFormData({ ...EMPTY_FORM })
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

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setFormData({ ...EMPTY_FORM })
      setCurrentTab("demografie")
      setError(null)
    }
    onOpenChange(isOpen)
  }

  const navigateTab = (direction: 1 | -1) => {
    const currentIndex = TABS.indexOf(currentTab as (typeof TABS)[number])
    const newIndex = currentIndex + direction
    if (newIndex >= 0 && newIndex < TABS.length) setCurrentTab(TABS[newIndex])
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0" showCloseButton={false}>
        <div className="flex flex-col max-h-[90vh] p-6 gap-4">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 z-10"
          >
            <span className="sr-only">Close</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>

          <GenerationOverlay generatingProfile={generatingProfile} generatingImage={generatingImage} generationStep={generationStep} />

          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Neuen Wunschpatienten erstellen
            </DialogTitle>
            <DialogDescription>
              Definieren Sie die Merkmale Ihres idealen Patienten. Die KI generiert automatisch ein detailliertes Profil
              mit Marketingstrategie und einem photorealistischen Patientenbild.
            </DialogDescription>
          </DialogHeader>

          {error && <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm flex-shrink-0">{error}</div>}

          {generatingImage && (
            <div className="bg-primary/10 text-primary px-4 py-3 rounded-md text-sm flex items-center gap-2 flex-shrink-0">
              <ImageIcon className="h-4 w-4 animate-pulse" />
              <span>KI generiert ein photorealistisches Patientenbild...</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-2 -mr-2 min-h-0">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="demografie">Demografie</TabsTrigger>
                <TabsTrigger value="gesundheit">Gesundheit</TabsTrigger>
                <TabsTrigger value="verhalten">Verhalten</TabsTrigger>
                <TabsTrigger value="werte">Werte</TabsTrigger>
              </TabsList>
              <TabsContent value="demografie"><DemografieTab formData={formData} onChange={setFormData} /></TabsContent>
              <TabsContent value="gesundheit"><GesundheitTab formData={formData} onChange={setFormData} /></TabsContent>
              <TabsContent value="verhalten"><VerhaltenTab formData={formData} onChange={setFormData} /></TabsContent>
              <TabsContent value="werte"><WerteTab formData={formData} onChange={setFormData} /></TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-between pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading || generatingImage}>
              Abbrechen
            </Button>
            <div className="flex gap-2">
              {currentTab !== "demografie" && (
                <Button variant="outline" onClick={() => navigateTab(-1)} disabled={loading || generatingImage}>
                  Zurück
                </Button>
              )}
              {currentTab !== "werte" ? (
                <Button onClick={() => navigateTab(1)}>Weiter</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading || generatingImage}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird erstellt...</>
                  ) : generatingImage ? (
                    <><ImageIcon className="mr-2 h-4 w-4 animate-pulse" />Bild wird generiert...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" />Profil erstellen</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateWunschpatientDialog

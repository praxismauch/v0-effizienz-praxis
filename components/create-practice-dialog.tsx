"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { AddressInput } from "@/components/address-input"
import { toast } from "@/hooks/use-toast"
import { Loader2, X, Check, ChevronsUpDown, Globe, Sparkles, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreatePracticeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PracticeType {
  id: string
  name: string
}

const BUNDESLAENDER = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
]

export function CreatePracticeDialog({ open, onOpenChange }: CreatePracticeDialogProps) {
  const [practiceTypes, setPracticeTypes] = useState<PracticeType[]>([])
  const [practiceForms, setPracticeForms] = useState<{ id: string; value: string; label: string }[]>([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [showAiInput, setShowAiInput] = useState(false)
  const [aiUrl, setAiUrl] = useState("")
  const [isAiExtracting, setIsAiExtracting] = useState(false)

  const [typesOpen, setTypesOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    praxisArt: "",
    types: [] as string[],
    bundesland: "",
    address: {
      street: "",
      city: "",
      zipCode: "",
    },
    phone: "",
    email: "",
    website: "",
    isActive: true,
  })

  useEffect(() => {
    if (open) {
      loadPracticeTypes()
      loadPracticeForms()
    }
  }, [open])

  const loadPracticeForms = async () => {
    try {
      const response = await fetch("/api/practice-forms")
      if (response.ok) {
        const data = await response.json()
        setPracticeForms(data || [])
      }
    } catch (error) {
      console.error("Error loading practice forms:", error)
    }
  }

  const loadPracticeTypes = async () => {
    setIsLoadingTypes(true)
    try {
      const response = await fetch("/api/practice-types")
      if (response.ok) {
        const data = await response.json()
        setPracticeTypes(data || [])
      } else {
        throw new Error("Failed to load practice types")
      }
    } catch (error) {
      console.error("Error loading practice types:", error)
      toast({
        title: "Warnung",
        description: "Praxistypen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      })
      setPracticeTypes([])
    } finally {
      setIsLoadingTypes(false)
    }
  }

  const handleAiExtract = async () => {
    if (!aiUrl.trim()) {
      toast({ title: "Bitte geben Sie eine URL ein.", variant: "destructive" })
      return
    }

    setIsAiExtracting(true)
    try {
      const response = await fetch("/api/practices/ai-extract-from-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: aiUrl.trim() }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Fehler bei der KI-Analyse")
      }

      const data = result.data
      if (!data) {
        throw new Error("Keine Daten von der KI-Analyse erhalten")
      }

      // Match extracted fachrichtungen against available practice types
      const matchedTypes: string[] = []
      if (data.fachrichtungen && Array.isArray(data.fachrichtungen)) {
        for (const fach of data.fachrichtungen) {
          const match = practiceTypes.find(
            (pt) =>
              pt.name.toLowerCase() === fach.toLowerCase() ||
              pt.name.toLowerCase().includes(fach.toLowerCase()) ||
              fach.toLowerCase().includes(pt.name.toLowerCase()),
          )
          if (match && !matchedTypes.includes(match.name)) {
            matchedTypes.push(match.name)
          }
        }
      }

      setFormData((prev) => ({
        ...prev,
        name: data.name || prev.name,
        praxisArt: data.praxisArt || prev.praxisArt,
        types: matchedTypes.length > 0 ? matchedTypes : prev.types,
        bundesland: data.bundesland || prev.bundesland,
        address: {
          street: data.street || prev.address.street,
          city: data.city || prev.address.city,
          zipCode: data.zipCode || prev.address.zipCode,
        },
        phone: data.phone || prev.phone,
        email: data.email || prev.email,
        website: data.website || result.websiteUrl || prev.website,
      }))

      setShowAiInput(false)

      const filledFields = [
        data.name && "Name",
        data.praxisArt && "Praxisart",
        matchedTypes.length > 0 && "Fachrichtungen",
        data.bundesland && "Bundesland",
        (data.street || data.city) && "Adresse",
        data.phone && "Telefon",
        data.email && "E-Mail",
      ].filter(Boolean)

      toast({
        title: "KI-Analyse abgeschlossen",
        description: `${filledFields.length} Felder ausgefüllt: ${filledFields.join(", ")}. Bitte prüfen Sie die Angaben.`,
      })
    } catch (error: any) {
      toast({
        title: "Fehler bei der KI-Analyse",
        description: error.message || "Die Website konnte nicht analysiert werden.",
        variant: "destructive",
      })
    } finally {
      setIsAiExtracting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.praxisArt || formData.types.length === 0 || !formData.bundesland) {
      toast({
        title: "Validierungsfehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus (Name, Praxisart, mind. eine Fachrichtung und Bundesland).",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/practices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.praxisArt,
          specialization: formData.types.join(", "),
          bundesland: formData.bundesland,
          street: formData.address.street,
          city: formData.address.city,
          zipCode: formData.address.zipCode,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || "Fehler beim Erstellen der Praxis")
      }

      const newPractice = await response.json()

      toast({
        title: "Erfolg",
        description: `Praxis "${formData.name}" wurde erfolgreich erstellt.`,
      })

      setFormData({
        name: "",
        praxisArt: "",
        types: [],
        bundesland: "",
        address: {
          street: "",
          city: "",
          zipCode: "",
        },
        phone: "",
        email: "",
        website: "",
        isActive: true,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error creating practice:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Die Praxis konnte nicht erstellt werden.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neue Praxis erstellen</DialogTitle>
          <DialogDescription>
            Fügen Sie eine neue Praxis zu Ihrem Konto hinzu. Sie können mehrere Praxen über ein Dashboard verwalten.
          </DialogDescription>
        </DialogHeader>

        {/* AI Extraction Section */}
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
          {!showAiInput ? (
            <button
              type="button"
              onClick={() => setShowAiInput(true)}
              className="flex w-full items-center gap-3 text-left group"
              disabled={isSubmitting}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">KI-Ausfüllung per Website</p>
                <p className="text-xs text-muted-foreground">
                  Website-URL eingeben und Formular automatisch ausfüllen lassen
                </p>
              </div>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowAiInput(false)} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <p className="text-sm font-medium">Praxis-Website analysieren</p>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="www.praxis-beispiel.de"
                    value={aiUrl}
                    onChange={(e) => setAiUrl(e.target.value)}
                    className="pl-8 h-9 text-sm"
                    disabled={isAiExtracting}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAiExtract()
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAiExtract}
                  disabled={isAiExtracting || !aiUrl.trim()}
                  className="h-9 gap-1.5"
                >
                  {isAiExtracting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Analysiere...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Ausfüllen
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Die KI analysiert die öffentliche Website und füllt das Formular aus. Bitte Angaben prüfen.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Praxisname *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Praxis Dr. Müller"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label>Praxisart *</Label>
              <Select
                value={formData.praxisArt}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, praxisArt: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Praxisart wählen" />
                </SelectTrigger>
                <SelectContent>
                  {practiceForms.map((form) => (
                    <SelectItem key={form.id} value={form.value}>
                      {form.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Fachrichtungen *</Label>
              <Popover open={typesOpen} onOpenChange={setTypesOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={typesOpen}
                    className="w-full justify-between h-auto min-h-10 font-normal"
                    disabled={isLoadingTypes || isSubmitting}
                  >
                    {formData.types.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {formData.types.map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs">
                            {t}
                            <button
                              type="button"
                              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormData((prev) => ({
                                  ...prev,
                                  types: prev.types.filter((x) => x !== t),
                                }))
                              }}
                            >
                              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        {isLoadingTypes ? "Laden..." : "Fachrichtungen wählen..."}
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {practiceTypes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">Keine Fachrichtung gefunden.</p>
                    ) : (
                      practiceTypes.map((type) => (
                        <label
                          key={type.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
                        >
                          <Checkbox
                            checked={formData.types.includes(type.name)}
                            onCheckedChange={(checked) => {
                              setFormData((prev) => ({
                                ...prev,
                                types: checked
                                  ? [...prev.types, type.name]
                                  : prev.types.filter((t) => t !== type.name),
                              }))
                            }}
                          />
                          {type.name}
                        </label>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bundesland">Bundesland *</Label>
              <Select
                value={formData.bundesland}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, bundesland: value }))}
                required
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bundesland wählen" />
                </SelectTrigger>
                <SelectContent>
                  {BUNDESLAENDER.map((land) => (
                    <SelectItem key={land} value={land}>
                      {land}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Adresse</Label>
              <AddressInput
                value={formData.address}
                onChange={(address) => setFormData((prev) => ({ ...prev, address }))}
                required={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="030 12345678"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="kontakt@praxis.de"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                placeholder="https://www.praxis.de"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={!formData.name || !formData.praxisArt || formData.types.length === 0 || !formData.bundesland || isSubmitting || isLoadingTypes}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Praxis erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreatePracticeDialog

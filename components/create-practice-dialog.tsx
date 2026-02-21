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
import { Loader2, X, ChevronsUpDown, Globe, Sparkles, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreatePracticeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const PRACTICE_TYPES = [
  "Allgemeinmedizin",
  "Innere Medizin",
  "Paediatrie",
  "Kardiologie",
  "Dermatologie",
  "Orthopaedie",
  "Gynaekologie",
  "HNO",
  "Neurologie",
  "Psychiatrie",
  "Urologie",
  "Augenheilkunde",
  "Radiologie",
  "Anaesthesie",
  "Chirurgie",
  "Zahnarzt",
  "Physiotherapie",
  "Andere",
]

const BUNDESLAENDER = [
  "Baden-Wuerttemberg",
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
  "Thueringen",
]

export function CreatePracticeDialog({ open, onOpenChange, onSuccess }: CreatePracticeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fachrichtungenOpen, setFachrichtungenOpen] = useState(false)
  const [practiceForms, setPracticeForms] = useState<{ id: string; value: string; label: string }[]>([])
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (open) {
      fetch("/api/practice-forms")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setPracticeForms(data)
        })
        .catch(() => {})
    }
  }, [open])

  const [formData, setFormData] = useState({
    name: "",
    praxisArt: "",
    fachrichtungen: [] as string[],
    bundesland: "",
    street: "",
    city: "",
    zipCode: "",
    phone: "",
    email: "",
    website: "",
    description: "",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      praxisArt: "",
      fachrichtungen: [],
      bundesland: "",
      street: "",
      city: "",
      zipCode: "",
      phone: "",
      email: "",
      website: "",
      description: "",
    })
    setStep(1)
  }

  useEffect(() => {
    if (!open) resetForm()
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.praxisArt || !formData.bundesland) {
      toast({
        title: "Fehler",
        description: "Bitte fuellen Sie alle Pflichtfelder aus (Name, Praxisart und Bundesland).",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/practices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          type: formData.praxisArt,
          specialization: formData.fachrichtungen.join(", "),
          bundesland: formData.bundesland,
          street: formData.street,
          city: formData.city,
          zip_code: formData.zipCode,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          description: formData.description,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Praxis konnte nicht erstellt werden")
      }

      toast({
        title: "Erfolg",
        description: `Praxis "${formData.name}" wurde erfolgreich erstellt.`,
      })

      onSuccess?.()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error creating practice:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Praxis konnte nicht erstellt werden.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neue Praxis erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie eine neue Praxis. Felder mit * sind Pflichtfelder.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <div className="grid gap-4">
              {/* Practice Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Praxisname <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Praxis Dr. Mueller"
                  required
                />
              </div>

              {/* Praxisart */}
              <div className="grid gap-2">
                <Label>
                  Praxisart <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.praxisArt}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, praxisArt: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Praxisart waehlen" />
                  </SelectTrigger>
                  <SelectContent>
                    {practiceForms.length > 0
                      ? practiceForms.map((form) => (
                          <SelectItem key={form.id} value={form.value}>
                            {form.label}
                          </SelectItem>
                        ))
                      : ["Einzelpraxis", "BAG", "MVZ", "Praxisgemeinschaft", "Facharztpraxis", "Zahnarztpraxis", "Sonstige"].map((type) => (
                          <SelectItem key={type} value={type.toLowerCase()}>
                            {type}
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Fachrichtungen Multi-Select */}
              <div className="grid gap-2">
                <Label>Fachrichtungen</Label>
                <Popover open={fachrichtungenOpen} onOpenChange={setFachrichtungenOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={fachrichtungenOpen}
                      className="w-full justify-between h-auto min-h-10 font-normal"
                      type="button"
                    >
                      {formData.fachrichtungen.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {formData.fachrichtungen.map((f) => (
                            <Badge key={f} variant="secondary" className="text-xs">
                              {f}
                              <button
                                type="button"
                                className="ml-1 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setFormData((prev) => ({
                                    ...prev,
                                    fachrichtungen: prev.fachrichtungen.filter((x) => x !== f),
                                  }))
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Fachrichtungen auswaehlen...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {PRACTICE_TYPES.map((type) => (
                        <label
                          key={type}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
                        >
                          <Checkbox
                            checked={formData.fachrichtungen.includes(type)}
                            onCheckedChange={(checked) => {
                              setFormData((prev) => ({
                                ...prev,
                                fachrichtungen: checked
                                  ? [...prev.fachrichtungen, type]
                                  : prev.fachrichtungen.filter((t) => t !== type),
                              }))
                            }}
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Bundesland */}
              <div className="grid gap-2">
                <Label>
                  Bundesland <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.bundesland}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, bundesland: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bundesland waehlen" />
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
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              {/* Address */}
              <div className="grid gap-2">
                <Label htmlFor="street">Strasse & Hausnummer</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
                  placeholder="z.B. Hauptstrasse 123"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="zipCode">PLZ</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="10115"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">Stadt</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="Berlin"
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="030 12345678"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="info@praxis.de"
                  />
                </div>
              </div>

              {/* Website */}
              <div className="grid gap-2">
                <Label htmlFor="website">Webseite</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                  placeholder="https://www.praxis.de"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {step === 2 && (
              <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={isSubmitting}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurueck
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Abbrechen
            </Button>
            {step === 1 ? (
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.praxisArt || !formData.bundesland}
              >
                Weiter
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Praxis erstellen
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

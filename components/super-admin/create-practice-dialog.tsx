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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { X, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreatePracticeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const PRACTICE_TYPES = [
  "Allgemeinmedizin",
  "Innere Medizin",
  "Pädiatrie",
  "Kardiologie",
  "Dermatologie",
  "Orthopädie",
  "Gynäkologie",
  "HNO",
  "Neurologie",
  "Psychiatrie",
  "Urologie",
  "Augenheilkunde",
  "Radiologie",
  "Anästhesie",
  "Chirurgie",
  "Zahnarzt",
  "Physiotherapie",
  "Andere",
]

const TIMEZONES = ["Europe/Berlin", "Europe/Vienna", "Europe/Zurich", "Europe/London", "Europe/Paris"]

const CURRENCIES = ["EUR", "CHF", "GBP", "USD"]

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

const PRAXIS_ARTEN = [
  { value: "einzelpraxis", label: "Einzelpraxis" },
  { value: "bag", label: "Berufsausübungsgemeinschaft (BAG)" },
  { value: "mvz", label: "Medizinisches Versorgungszentrum (MVZ)" },
  { value: "praxisgemeinschaft", label: "Praxisgemeinschaft" },
  { value: "facharzt", label: "Facharztpraxis" },
  { value: "zahnarzt", label: "Zahnarztpraxis" },
  { value: "other", label: "Sonstige" },
]

export function CreatePracticeDialog({ open, onOpenChange, onSuccess }: CreatePracticeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fachrichtungenOpen, setFachrichtungenOpen] = useState(false)
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
    timezone: "Europe/Berlin",
    currency: "EUR",
    isActive: true,
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
      timezone: "Europe/Berlin",
      currency: "EUR",
      isActive: true,
    })
  }

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.type || !formData.bundesland) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus (Name, Typ und Bundesland).",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { praxisArt, fachrichtungen, ...rest } = formData
      const response = await fetch("/api/practices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          type: praxisArt,
          specialization: fachrichtungen.join(", "),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create practice")
      }

      const data = await response.json()

      toast({
        title: "Erfolg",
        description: `Praxis "${formData.name}" wurde erstellt.`,
      })

      onSuccess()
      onOpenChange(false)
      resetForm()
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neue Praxis erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie eine neue Praxis im System. Felder mit * sind Pflichtfelder.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="z.B. Praxis Dr. Müller"
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
                  <SelectValue placeholder="Praxisart wählen" />
                </SelectTrigger>
                <SelectContent>
                  {PRAXIS_ARTEN.map((art) => (
                    <SelectItem key={art.value} value={art.value}>
                      {art.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fachrichtungen Multi-Select */}
            <div className="grid gap-2">
              <Label>
                Fachrichtungen <span className="text-destructive">*</span>
              </Label>
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
                              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormData((prev) => ({
                                  ...prev,
                                  fachrichtungen: prev.fachrichtungen.filter((x) => x !== f),
                                }))
                              }}
                            >
                              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Fachrichtungen wählen...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Fachrichtung suchen..." />
                    <CommandList>
                      <CommandEmpty>Keine Fachrichtung gefunden.</CommandEmpty>
                      <CommandGroup>
                        {PRACTICE_TYPES.map((type) => (
                          <CommandItem
                            key={type}
                            value={type}
                            onSelect={() => {
                              setFormData((prev) => ({
                                ...prev,
                                fachrichtungen: prev.fachrichtungen.includes(type)
                                  ? prev.fachrichtungen.filter((t) => t !== type)
                                  : [...prev.fachrichtungen, type],
                              }))
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.fachrichtungen.includes(type) ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {type}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Bundesland */}
            <div className="grid gap-2">
              <Label htmlFor="bundesland">
                Bundesland <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.bundesland}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, bundesland: value }))}
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

            {/* Address */}
            <div className="grid gap-2">
              <Label htmlFor="street">Straße & Hausnummer</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
                placeholder="z.B. Hauptstraße 123"
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

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="timezone">Zeitzone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">Währung</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr} value={curr}>
                        {curr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Praxis Status</Label>
                <div className="text-sm text-muted-foreground">
                  {formData.isActive ? "Praxis ist aktiv und sichtbar" : "Praxis ist inaktiv und verborgen"}
                </div>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={!formData.name || !formData.type || !formData.bundesland || isSubmitting}>
              {isSubmitting ? "Wird erstellt..." : "Praxis erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

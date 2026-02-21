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
import { AddressInput } from "@/components/address-input"
import { toast } from "@/hooks/use-toast"
import { Loader2, X, Check, ChevronsUpDown } from "lucide-react"
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
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    }
  }, [open])

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Neue Praxis erstellen</DialogTitle>
          <DialogDescription>
            Fügen Sie eine neue Praxis zu Ihrem Konto hinzu. Sie können mehrere Praxen über ein Dashboard verwalten.
          </DialogDescription>
        </DialogHeader>
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
                  <SelectItem value="einzelpraxis">Einzelpraxis</SelectItem>
                  <SelectItem value="bag">Berufsausübungsgemeinschaft (BAG)</SelectItem>
                  <SelectItem value="mvz">Medizinisches Versorgungszentrum (MVZ)</SelectItem>
                  <SelectItem value="praxisgemeinschaft">Praxisgemeinschaft</SelectItem>
                  <SelectItem value="facharzt">Facharztpraxis</SelectItem>
                  <SelectItem value="zahnarzt">Zahnarztpraxis</SelectItem>
                  <SelectItem value="other">Sonstige</SelectItem>
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
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Fachrichtung suchen..." />
                    <CommandList>
                      <CommandEmpty>Keine Fachrichtung gefunden.</CommandEmpty>
                      <CommandGroup>
                        {practiceTypes.map((type) => (
                          <CommandItem
                            key={type.id}
                            value={type.name}
                            onSelect={() => {
                              setFormData((prev) => ({
                                ...prev,
                                types: prev.types.includes(type.name)
                                  ? prev.types.filter((t) => t !== type.name)
                                  : [...prev.types, type.name],
                              }))
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.types.includes(type.name) ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {type.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
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

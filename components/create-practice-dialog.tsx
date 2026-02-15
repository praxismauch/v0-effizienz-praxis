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
import { AddressInput } from "@/components/address-input"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

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

  const [formData, setFormData] = useState({
    name: "",
    type: "",
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
    if (!formData.name || !formData.type || !formData.bundesland) {
      toast({
        title: "Validierungsfehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus (Name, Typ und Bundesland).",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      console.log("[v0] CLIENT: Creating practice with data:", formData)
      
      const response = await fetch("/api/practices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
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

      console.log("[v0] CLIENT: Response status:", response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.log("[v0] CLIENT: Error response:", errorData)
        throw new Error(errorData.message || "Fehler beim Erstellen der Praxis")
      }

      const newPractice = await response.json()

      toast({
        title: "Erfolg",
        description: `Praxis "${formData.name}" wurde erfolgreich erstellt.`,
      })

      // Reset form
      setFormData({
        name: "",
        type: "",
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
              <Label htmlFor="type">Typ *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                required
                disabled={isLoadingTypes || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingTypes ? "Laden..." : "Praxistyp wählen"} />
                </SelectTrigger>
                <SelectContent>
                  {practiceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button type="submit" disabled={!formData.name || !formData.type || !formData.bundesland || isSubmitting || isLoadingTypes}>
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

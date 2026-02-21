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
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { Loader2, X, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Practice {
  id: number
  name: string
  type: string
  specialization?: string
  street: string
  city: string
  zipCode: string
  phone: string
  email: string
  website: string
  isActive: boolean
}

interface EditPracticeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  practice: Practice | null
}

interface PracticeType {
  id: string
  name: string
}

export function EditPracticeDialog({ open, onOpenChange, practice }: EditPracticeDialogProps) {
  const [practiceTypes, setPracticeTypes] = useState<PracticeType[]>([])
  const [practiceForms, setPracticeForms] = useState<{ id: string; value: string; label: string }[]>([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fachrichtungenOpen, setFachrichtungenOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    praxisArt: "",
    fachrichtungen: [] as string[],
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
        description: "Praxistypen konnten nicht geladen werden.",
        variant: "destructive",
      })
      setPracticeTypes([])
    } finally {
      setIsLoadingTypes(false)
    }
  }

  useEffect(() => {
    if (practice) {
      // Parse existing specialization (comma-separated) into array
      const existingFachrichtungen = practice.specialization
        ? practice.specialization.split(",").map((s) => s.trim()).filter(Boolean)
        : []
      setFormData({
        name: practice.name,
        praxisArt: practice.type || "",
        fachrichtungen: existingFachrichtungen,
        address: {
          street: practice.street || "",
          city: practice.city || "",
          zipCode: practice.zipCode || "",
        },
        phone: practice.phone || "",
        email: practice.email || "",
        website: practice.website || "",
        isActive: practice.isActive,
      })
    }
  }, [practice])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!practice || !formData.name || !formData.praxisArt) {
      toast({
        title: "Validierungsfehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus (Name und Praxisart).",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/practices/${practice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.praxisArt,
          specialization: formData.fachrichtungen.join(", "),
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
        throw new Error(errorData.message || "Fehler beim Aktualisieren der Praxis")
      }

      toast({
        title: "Erfolg",
        description: `Praxis "${formData.name}" wurde erfolgreich aktualisiert.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error updating practice:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Die Praxis konnte nicht aktualisiert werden.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (practice) {
      const existingFachrichtungen = practice.specialization
        ? practice.specialization.split(",").map((s) => s.trim()).filter(Boolean)
        : []
      setFormData({
        name: practice.name,
        praxisArt: practice.type || "",
        fachrichtungen: existingFachrichtungen,
        address: {
          street: practice.street || "",
          city: practice.city || "",
          zipCode: practice.zipCode || "",
        },
        phone: practice.phone || "",
        email: practice.email || "",
        website: practice.website || "",
        isActive: practice.isActive,
      })
    }
    onOpenChange(false)
  }

  if (!practice) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Praxis bearbeiten</DialogTitle>
          <DialogDescription>
            Aktualisieren Sie die Praxisinformationen. Änderungen werden sofort gespeichert.
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
                  {practiceForms.map((form) => (
                    <SelectItem key={form.id} value={form.value}>
                      {form.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                    disabled={isLoadingTypes || isSubmitting}
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
                            checked={formData.fachrichtungen.includes(type.name)}
                            onCheckedChange={(checked) => {
                              setFormData((prev) => ({
                                ...prev,
                                fachrichtungen: checked
                                  ? [...prev.fachrichtungen, type.name]
                                  : prev.fachrichtungen.filter((t) => t !== type.name),
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

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Praxisstatus</Label>
                <div className="text-sm text-muted-foreground">
                  {formData.isActive
                    ? "Praxis ist aktiv und für Benutzer sichtbar"
                    : "Praxis ist inaktiv und ausgeblendet"}
                </div>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={!formData.name || !formData.praxisArt || isSubmitting || isLoadingTypes}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Praxis aktualisieren
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditPracticeDialog

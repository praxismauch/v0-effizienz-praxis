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
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Practice {
  id: number
  name: string
  type: string
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
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
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
      setFormData({
        name: practice.name,
        type: practice.type,
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
    if (!practice || !formData.name || !formData.type) {
      toast({
        title: "Validierungsfehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
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
          type: formData.type,
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
      setFormData({
        name: practice.name,
        type: practice.type,
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
            <Button type="submit" disabled={!formData.name || !formData.type || isSubmitting || isLoadingTypes}>
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

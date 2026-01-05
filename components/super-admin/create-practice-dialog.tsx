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
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"

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

export function CreatePracticeDialog({ open, onOpenChange, onSuccess }: CreatePracticeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "",
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
      type: "",
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

    if (!formData.name || !formData.type) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/practices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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

            {/* Practice Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">
                Fachrichtung <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fachrichtung wählen" />
                </SelectTrigger>
                <SelectContent>
                  {PRACTICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
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
            <Button type="submit" disabled={!formData.name || !formData.type || isSubmitting}>
              {isSubmitting ? "Wird erstellt..." : "Praxis erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

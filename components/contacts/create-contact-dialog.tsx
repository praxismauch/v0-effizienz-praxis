"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"

interface CreateContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateContactDialog({ open, onOpenChange, onSuccess }: CreateContactDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { currentUser, loading: authLoading } = useUser()
  const { currentPractice } = usePractice()

  const [formData, setFormData] = useState({
    salutation: "",
    title: "",
    first_name: "",
    last_name: "",
    company: "",
    position: "",
    email: "",
    phone: "",
    mobile: "",
    fax: "",
    website: "",
    street: "",
    house_number: "",
    postal_code: "",
    city: "",
    country: "Deutschland",
    category: "",
    notes: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const practiceId = currentPractice?.id || currentUser?.practice_id

      if (!practiceId) {
        toast({
          title: "Fehler",
          description: "Keine Praxis zugeordnet. Bitte laden Sie die Seite neu.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/practices/${practiceId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          created_by: currentUser?.id || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Kontakt konnte nicht erstellt werden")
      }

      toast({
        title: "Erfolg",
        description: "Kontakt wurde erstellt",
      })
      onSuccess()
      onOpenChange(false)
      setFormData({
        salutation: "",
        title: "",
        first_name: "",
        last_name: "",
        company: "",
        position: "",
        email: "",
        phone: "",
        mobile: "",
        fax: "",
        website: "",
        street: "",
        house_number: "",
        postal_code: "",
        city: "",
        country: "Deutschland",
        category: "",
        notes: "",
      })
    } catch (error: any) {
      console.error("[v0] Contact creation error:", error)
      toast({
        title: "Fehler",
        description: error.message || "Kontakt konnte nicht erstellt werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value === "__none__" ? "" : value })
  }

  const hasPractice = currentPractice?.id || currentUser?.practice_id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neuer Kontakt</DialogTitle>
          <DialogDescription>Erstellen Sie einen neuen Kontakt für Ihre Praxis</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salutation">Anrede</Label>
              <Select
                value={formData.salutation || "__none__"}
                onValueChange={(value) => handleSelectChange("salutation", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Keine Angabe</SelectItem>
                  <SelectItem value="Herr">Herr</SelectItem>
                  <SelectItem value="Frau">Frau</SelectItem>
                  <SelectItem value="Divers">Divers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Dr. med., Prof., etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Vorname</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Nachname *</Label>
              <Input
                id="last_name"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Firma</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mobile">Mobil</Label>
              <Input
                id="mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="fax">Fax</Label>
              <Input
                id="fax"
                value={formData.fax}
                onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="street">Straße</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="house_number">Nr.</Label>
              <Input
                id="house_number"
                value={formData.house_number}
                onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="postal_code">PLZ</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Stadt</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category">Kategorie</Label>
              <Select
                value={formData.category || "__none__"}
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Keine Angabe</SelectItem>
                  <SelectItem value="Patient">Patient</SelectItem>
                  <SelectItem value="Lieferant">Lieferant</SelectItem>
                  <SelectItem value="Partner">Partner</SelectItem>
                  <SelectItem value="Versicherung">Versicherung</SelectItem>
                  <SelectItem value="Sonstiges">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || authLoading || !hasPractice}>
              {loading ? "Speichert..." : "Speichern"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateContactDialog

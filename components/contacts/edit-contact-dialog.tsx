"use client"

import type React from "react"
import { useUser } from "@/contexts/user-context"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"

interface Contact {
  id: string
  salutation: string | null
  title: string | null
  first_name: string | null
  last_name: string
  company: string | null
  position: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  fax: string | null
  website: string | null
  street: string | null
  house_number: string | null
  postal_code: string | null
  city: string | null
  country: string | null
  category: string | null
  notes: string | null
  contact_person?: string | null
  direct_phone?: string | null
  availability?: string | null
}

interface EditContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact
  onSuccess: () => void
}

export function EditContactDialog({ open, onOpenChange, contact, onSuccess }: EditContactDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()

  const [formData, setFormData] = useState({
    salutation: contact.salutation || "",
    title: contact.title || "",
    first_name: contact.first_name || "",
    last_name: contact.last_name,
    company: contact.company || "",
    position: contact.position || "",
    email: contact.email || "",
    phone: contact.phone || "",
    mobile: contact.mobile || "",
    fax: contact.fax || "",
    website: contact.website || "",
    street: contact.street || "",
    house_number: contact.house_number || "",
    postal_code: contact.postal_code || "",
    city: contact.city || "",
    country: contact.country || "Deutschland",
    category: contact.category || "",
    notes: contact.notes || "",
    contact_person: contact.contact_person || "",
    direct_phone: contact.direct_phone || "",
    availability: contact.availability || "",
  })

  useEffect(() => {
    setFormData({
      salutation: contact.salutation || "",
      title: contact.title || "",
      first_name: contact.first_name || "",
      last_name: contact.last_name,
      company: contact.company || "",
      position: contact.position || "",
      email: contact.email || "",
      phone: contact.phone || "",
      mobile: contact.mobile || "",
      fax: contact.fax || "",
      website: contact.website || "",
      street: contact.street || "",
      house_number: contact.house_number || "",
      postal_code: contact.postal_code || "",
      city: contact.city || "",
      country: contact.country || "Deutschland",
      category: contact.category || "",
      notes: contact.notes || "",
      contact_person: contact.contact_person || "",
      direct_phone: contact.direct_phone || "",
      availability: contact.availability || "",
    })
  }, [contact])

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value === "__none__" ? "" : value })
  }

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

      const response = await fetch(`/api/practices/${practiceId}/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update contact")
      }

      toast({
        title: "Erfolg",
        description: "Kontakt wurde aktualisiert",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const hasPractice = currentPractice?.id || currentUser?.practice_id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kontakt bearbeiten</DialogTitle>
          <DialogDescription>Bearbeiten Sie die Kontaktdaten</DialogDescription>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_person">Ansprechpartner</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Name des Ansprechpartners"
              />
            </div>
            <div>
              <Label htmlFor="direct_phone">Direktnummer</Label>
              <Input
                id="direct_phone"
                value={formData.direct_phone}
                onChange={(e) => setFormData({ ...formData, direct_phone: e.target.value })}
                placeholder="Durchwahl / Direktnummer"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="availability">Erreichbarkeit</Label>
            <Input
              id="availability"
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              placeholder="z.B. nur vormittags, 24/7, Mo-Fr 9-17 Uhr"
            />
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
            <Button type="submit" disabled={loading || !hasPractice}>
              {loading ? "Speichert..." : "Speichern"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditContactDialog

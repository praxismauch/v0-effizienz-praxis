"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ContactSelector } from "./contact-selector"
import type { DeviceFormData, ContactOption } from "./device-form-types"

interface DeviceConsumablesTabProps {
  formData: DeviceFormData
  setFormData: (fn: (prev: DeviceFormData) => DeviceFormData) => void
  contacts: ContactOption[]
  contactsLoading: boolean
}

export function DeviceConsumablesTab({
  formData,
  setFormData,
  contacts,
  contactsLoading,
}: DeviceConsumablesTabProps) {
  const [showSelector, setShowSelector] = useState(false)

  const updateField = <K extends keyof DeviceFormData>(key: K, value: DeviceFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleConsumablesContactSelect = (contact: ContactOption) => {
    setFormData((prev) => ({
      ...prev,
      consumables_supplier: contact.company || `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
    }))
    setShowSelector(false)
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <ContactSelector
          label="Verbrauchsmaterial-Lieferant"
          isOpen={showSelector}
          onToggle={() => setShowSelector(!showSelector)}
          contacts={contacts}
          contactsLoading={contactsLoading}
          onSelect={handleConsumablesContactSelect}
        />
        <Input
          value={formData.consumables_supplier}
          onChange={(e) => updateField("consumables_supplier", e.target.value)}
          placeholder="Name des Lieferanten"
        />
      </div>
      <div className="col-span-2">
        <Label>Bestell-URL</Label>
        <Input
          value={formData.consumables_order_url}
          onChange={(e) => updateField("consumables_order_url", e.target.value)}
          placeholder="Link zur Bestellseite"
        />
      </div>
      <div className="col-span-2">
        <Label>Hinweise zu Verbrauchsmaterial</Label>
        <Textarea
          value={formData.consumables_notes}
          onChange={(e) => updateField("consumables_notes", e.target.value)}
          placeholder="z.B. Artikelnummern, Bestellmengen, etc."
          rows={4}
        />
      </div>
    </div>
  )
}

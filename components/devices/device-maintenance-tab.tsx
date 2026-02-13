"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ContactSelector } from "./contact-selector"
import type { DeviceFormData, ContactOption } from "./device-form-types"

interface DeviceMaintenanceTabProps {
  formData: DeviceFormData
  setFormData: (fn: (prev: DeviceFormData) => DeviceFormData) => void
  contacts: ContactOption[]
  contactsLoading: boolean
}

export function DeviceMaintenanceTab({
  formData,
  setFormData,
  contacts,
  contactsLoading,
}: DeviceMaintenanceTabProps) {
  const [showContactSelector, setShowContactSelector] = useState(false)

  const updateField = <K extends keyof DeviceFormData>(key: K, value: DeviceFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleContactSelect = (contact: ContactOption) => {
    setFormData((prev) => ({
      ...prev,
      maintenance_service_partner: contact.company || `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
      maintenance_service_contact: `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
      maintenance_service_phone: contact.phone || "",
      maintenance_service_email: contact.email || "",
    }))
    setShowContactSelector(false)
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Wartungsintervall (Tage)</Label>
        <Input
          type="number"
          min="0"
          value={formData.maintenance_interval_days}
          onChange={(e) => updateField("maintenance_interval_days", e.target.value)}
          placeholder="z.B. 365"
        />
      </div>
      <div>
        <Label>Letzte Wartung</Label>
        <Input
          type="date"
          value={formData.last_maintenance_date}
          onChange={(e) => updateField("last_maintenance_date", e.target.value)}
        />
      </div>
      <div className="col-span-2">
        <ContactSelector
          label="Servicepartner"
          isOpen={showContactSelector}
          onToggle={() => setShowContactSelector(!showContactSelector)}
          contacts={contacts}
          contactsLoading={contactsLoading}
          onSelect={handleContactSelect}
        />
        <Input
          value={formData.maintenance_service_partner}
          onChange={(e) => updateField("maintenance_service_partner", e.target.value)}
          placeholder="Name des Servicepartners"
        />
      </div>
      <div>
        <Label>Ansprechpartner</Label>
        <Input
          value={formData.maintenance_service_contact}
          onChange={(e) => updateField("maintenance_service_contact", e.target.value)}
          placeholder="Name"
        />
      </div>
      <div>
        <Label>Telefon</Label>
        <Input
          value={formData.maintenance_service_phone}
          onChange={(e) => updateField("maintenance_service_phone", e.target.value)}
          placeholder="Telefonnummer"
        />
      </div>
      <div className="col-span-2">
        <Label>E-Mail</Label>
        <Input
          type="email"
          value={formData.maintenance_service_email}
          onChange={(e) => updateField("maintenance_service_email", e.target.value)}
          placeholder="service@example.com"
        />
      </div>
    </div>
  )
}

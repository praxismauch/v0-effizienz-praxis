"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { FileText, Upload } from "lucide-react"
import { ContactSelector } from "./contact-selector"
import type { DeviceFormData, ContactOption } from "./device-form-types"

interface DevicePurchaseTabProps {
  formData: DeviceFormData
  setFormData: (fn: (prev: DeviceFormData) => DeviceFormData) => void
  contacts: ContactOption[]
  contactsLoading: boolean
  purchaseReceiptUrl: string | null
  setPurchaseReceiptUrl: (url: string | null) => void
  isUploadingReceipt: boolean
  onReceiptUpload: (file: File) => void
}

export function DevicePurchaseTab({
  formData,
  setFormData,
  contacts,
  contactsLoading,
  purchaseReceiptUrl,
  setPurchaseReceiptUrl,
  isUploadingReceipt,
  onReceiptUpload,
}: DevicePurchaseTabProps) {
  const [showSupplierSelector, setShowSupplierSelector] = useState(false)

  const updateField = <K extends keyof DeviceFormData>(key: K, value: DeviceFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSupplierContactSelect = (contact: ContactOption) => {
    setFormData((prev) => ({
      ...prev,
      supplier_name: contact.company || `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
      supplier_contact: contact.phone || contact.email || "",
    }))
    setShowSupplierSelector(false)
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Kaufdatum</Label>
        <Input
          type="date"
          value={formData.purchase_date}
          onChange={(e) => updateField("purchase_date", e.target.value)}
        />
      </div>
      <div>
        <Label>Kaufpreis (EUR)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={formData.purchase_price}
          onChange={(e) => updateField("purchase_price", e.target.value)}
          placeholder="0.00"
        />
      </div>
      <div className="col-span-2">
        <ContactSelector
          label="Lieferant"
          isOpen={showSupplierSelector}
          onToggle={() => setShowSupplierSelector(!showSupplierSelector)}
          contacts={contacts}
          contactsLoading={contactsLoading}
          onSelect={handleSupplierContactSelect}
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              value={formData.supplier_name}
              onChange={(e) => updateField("supplier_name", e.target.value)}
              placeholder="Name des Lieferanten"
            />
          </div>
          <div>
            <Input
              value={formData.supplier_contact}
              onChange={(e) => updateField("supplier_contact", e.target.value)}
              placeholder="Telefon oder E-Mail"
            />
          </div>
        </div>
      </div>
      <div>
        <Label>Garantie bis</Label>
        <Input
          type="date"
          value={formData.warranty_end_date}
          onChange={(e) => updateField("warranty_end_date", e.target.value)}
        />
      </div>

      <div className="col-span-2 pt-2 border-t">
        <Label className="mb-2 block">Kaufbeleg</Label>
        {purchaseReceiptUrl ? (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <a
              href={purchaseReceiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline truncate flex-1"
            >
              Kaufbeleg anzeigen
            </a>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPurchaseReceiptUrl(null)}
              className="h-7 text-xs text-destructive hover:text-destructive"
            >
              Entfernen
            </Button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="file"
              accept=".pdf,image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onReceiptUpload(file)
                e.target.value = ""
              }}
              disabled={isUploadingReceipt}
            />
            <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
              {isUploadingReceipt ? (
                <span className="text-sm text-muted-foreground">Wird hochgeladen...</span>
              ) : (
                <>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    PDF oder Bild hochladen (max. 10MB)
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

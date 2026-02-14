"use client"

import { useState, useEffect } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useTeam } from "@/contexts/team-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import type { Room, ContactOption, Department, InstructionDocument, DeviceFormData } from "./device-form-types"
import { EMPTY_FORM_DATA } from "./device-form-types"
import { DeviceBasicTab } from "./device-basic-tab"
import { DevicePurchaseTab } from "./device-purchase-tab"
import { DeviceMaintenanceTab } from "./device-maintenance-tab"
import { DeviceConsumablesTab } from "./device-consumables-tab"
import { DeviceInstructionsTab } from "./device-instructions-tab"
import { DeviceDetailsTab } from "./device-details-tab"

interface CreateDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editDevice?: any
}

export function CreateDeviceDialog({ open, onOpenChange, onSuccess, editDevice }: CreateDeviceDialogProps) {
  const { currentPractice } = usePractice()
  const { teamMembers, loading: teamLoading } = useTeam()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const [contacts, setContacts] = useState<ContactOption[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [formData, setFormData] = useState<DeviceFormData>({ ...EMPTY_FORM_DATA })

  const [handbookFileName, setHandbookFileName] = useState<string | null>(null)
  const [isUploadingHandbook, setIsUploadingHandbook] = useState(false)
  const [instructionDocuments, setInstructionDocuments] = useState<InstructionDocument[]>([])
  const [purchaseReceiptUrl, setPurchaseReceiptUrl] = useState<string | null>(null)
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)

  const practiceId = currentPractice?.id

  // Fetch helper data when dialog opens
  useEffect(() => {
    if (open && practiceId) {
      fetchRooms()
      fetchContacts()
      fetchDepartments()
    }
  }, [open, practiceId])

  const fetchRooms = async () => {
    if (!practiceId) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/rooms`)
      if (response.ok) setRooms(await response.json())
    } catch (error) {
      console.error("Error fetching rooms:", error)
    }
  }

  const fetchContacts = async () => {
    if (!practiceId) return
    setContactsLoading(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/contacts`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data.filter((c: ContactOption) => c.company || c.first_name || c.last_name))
      }
    } catch (error) {
      console.error("Error fetching contacts:", error)
    } finally {
      setContactsLoading(false)
    }
  }

  const fetchDepartments = async () => {
    if (!practiceId) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/departments`)
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.departments || [])
      }
    } catch (error) {
      console.error("Error fetching departments:", error)
    }
  }

  // Populate form when editing or reset when creating
  useEffect(() => {
    if (editDevice) {
      setFormData({
        name: editDevice.name || "",
        description: editDevice.description || "",
        category: editDevice.category || "diagnostik",
        manufacturer: editDevice.manufacturer || "",
        model: editDevice.model || "",
        serial_number: editDevice.serial_number || "",
        inventory_number: editDevice.inventory_number || "",
        purchase_date: editDevice.purchase_date || "",
        purchase_price: editDevice.purchase_price?.toString() || "",
        supplier_name: editDevice.supplier_name || "",
        supplier_contact: editDevice.supplier_contact || "",
        warranty_end_date: editDevice.warranty_end_date || "",
        location: editDevice.location || "",
        room: editDevice.room || "",
        responsible_user_id: editDevice.responsible_user_id || "",
        image_url: editDevice.image_url || "",
        handbook_url: editDevice.handbook_url || "",
        maintenance_interval_days: editDevice.maintenance_interval_days?.toString() || "",
        last_maintenance_date: editDevice.last_maintenance_date || "",
        maintenance_service_partner: editDevice.maintenance_service_partner || "",
        maintenance_service_contact: editDevice.maintenance_service_contact || "",
        maintenance_service_phone: editDevice.maintenance_service_phone || "",
        maintenance_service_email: editDevice.maintenance_service_email || "",
        consumables_supplier: editDevice.consumables_supplier || "",
        consumables_order_url: editDevice.consumables_order_url || "",
        consumables_notes: editDevice.consumables_notes || "",
        cleaning_instructions: editDevice.cleaning_instructions || "",
        maintenance_instructions: editDevice.maintenance_instructions || "",
        short_sop: editDevice.short_sop || "",
        status: editDevice.status || "active",
        software_version: editDevice.software_version || "",
        mpg_class: editDevice.mpg_class || "",
        ce_marking: editDevice.ce_marking || false,
        safety_relevant: editDevice.safety_relevant || false,
      })
      if (editDevice.image_url) {
        try {
          const parsed = JSON.parse(editDevice.image_url)
          setImages(Array.isArray(parsed) ? parsed : [editDevice.image_url])
        } catch {
          setImages([editDevice.image_url])
        }
      }
      setSelectedRoomIds(editDevice.room_ids?.length > 0 ? editDevice.room_ids : [])
      if (editDevice.handbook_url) {
        const urlParts = editDevice.handbook_url.split("/")
        setHandbookFileName(urlParts[urlParts.length - 1]?.split("-").slice(1).join("-") || "Handbuch")
      }
      if (editDevice.instruction_documents && Array.isArray(editDevice.instruction_documents)) {
        setInstructionDocuments(editDevice.instruction_documents)
      }
      if (editDevice.purchase_receipt_url) {
        setPurchaseReceiptUrl(editDevice.purchase_receipt_url)
      }
    } else {
      setFormData({ ...EMPTY_FORM_DATA })
      setImages([])
      setSelectedRoomIds([])
      setHandbookFileName(null)
      setInstructionDocuments([])
      setPurchaseReceiptUrl(null)
      setIsUploadingReceipt(false)
    }
    setActiveTab("basic")
  }, [editDevice, open])

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds((prev) => (prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]))
  }

  const handleReceiptUpload = async (file: File) => {
    if (!practiceId) return
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Ungültiger Dateityp", description: "Nur PDF und Bilder sind erlaubt", variant: "destructive" })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Datei zu groß", description: "Maximale Dateigröße: 10MB", variant: "destructive" })
      return
    }
    setIsUploadingReceipt(true)
    try {
      const uploadData = new FormData()
      uploadData.append("file", file)
      uploadData.append("type", "general")
      uploadData.append("practiceId", practiceId)
      const response = await fetch("/api/upload/unified", { method: "POST", body: uploadData })
      if (response.ok) {
        const data = await response.json()
        setPurchaseReceiptUrl(data.url)
        toast({ title: "Kaufbeleg hochgeladen" })
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("Error uploading receipt:", error)
      toast({ title: "Upload fehlgeschlagen", description: "Fehler beim Hochladen des Kaufbelegs", variant: "destructive" })
    } finally {
      setIsUploadingReceipt(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Fehler", description: "Bitte geben Sie einen Gerätenamen ein.", variant: "destructive" })
      return
    }
    if (!practiceId) {
      toast({ title: "Fehler", description: "Keine Praxis ausgewählt.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const url = editDevice
        ? `/api/practices/${practiceId}/devices/${editDevice.id}`
        : `/api/practices/${practiceId}/devices`

      const payload = {
        ...formData,
        image_url: images.length > 0 ? JSON.stringify(images) : null,
        purchase_date: formData.purchase_date || null,
        warranty_end_date: formData.warranty_end_date || null,
        last_maintenance_date: formData.last_maintenance_date || null,
        purchase_price: formData.purchase_price ? Number.parseFloat(formData.purchase_price) : null,
        maintenance_interval_days: formData.maintenance_interval_days ? Number.parseInt(formData.maintenance_interval_days) : null,
        room_ids: selectedRoomIds,
        serial_number: formData.serial_number || null,
        inventory_number: formData.inventory_number || null,
        supplier_name: formData.supplier_name || null,
        supplier_contact: formData.supplier_contact || null,
        responsible_user_id: formData.responsible_user_id || null,
        handbook_url: formData.handbook_url || null,
        maintenance_service_partner: formData.maintenance_service_partner || null,
        maintenance_service_contact: formData.maintenance_service_contact || null,
        maintenance_service_phone: formData.maintenance_service_phone || null,
        maintenance_service_email: formData.maintenance_service_email || null,
        purchase_receipt_url: purchaseReceiptUrl || null,
        instruction_documents: instructionDocuments,
      }

      const response = await fetch(url, {
        method: editDevice ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: editDevice ? "Gerät aktualisiert" : "Gerät erstellt",
          description: editDevice ? "Das Gerät wurde erfolgreich aktualisiert." : "Das Gerät wurde erfolgreich erstellt.",
        })
        onOpenChange(false)
        onSuccess()
      } else {
        throw new Error(data?.error || "Unbekannter Fehler")
      }
    } catch (error) {
      console.error("Device save error:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Das Gerät konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const setFormDataFn = (fn: (prev: DeviceFormData) => DeviceFormData) => {
    setFormData((prev) => fn(prev))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{editDevice ? "Gerät bearbeiten" : "Neues Gerät"}</DialogTitle>
          <DialogDescription>
            {editDevice ? "Bearbeiten Sie die Informationen des Geräts" : "Fügen Sie ein neues medizinisches Gerät hinzu"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col min-h-0 flex-1">
          <TabsList className="grid w-full grid-cols-6 flex-shrink-0">
            <TabsTrigger value="basic">Basis</TabsTrigger>
            <TabsTrigger value="purchase">Kauf</TabsTrigger>
            <TabsTrigger value="maintenance">Wartung</TabsTrigger>
            <TabsTrigger value="consumables">Verbrauch</TabsTrigger>
            <TabsTrigger value="instructions">Anleitungen</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4 min-h-0">
            <TabsContent value="basic" className="mt-0 space-y-4">
              <DeviceBasicTab
                formData={formData}
                setFormData={setFormDataFn}
                rooms={rooms}
                selectedRoomIds={selectedRoomIds}
                toggleRoom={toggleRoom}
                departments={departments}
                teamMembers={teamMembers}
                teamLoading={teamLoading}
                images={images}
                setImages={setImages}
                practiceId={practiceId}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="purchase" className="mt-0 space-y-4">
              <DevicePurchaseTab
                formData={formData}
                setFormData={setFormDataFn}
                contacts={contacts}
                contactsLoading={contactsLoading}
                purchaseReceiptUrl={purchaseReceiptUrl}
                setPurchaseReceiptUrl={setPurchaseReceiptUrl}
                isUploadingReceipt={isUploadingReceipt}
                onReceiptUpload={handleReceiptUpload}
              />
            </TabsContent>

            <TabsContent value="maintenance" className="mt-0 space-y-4">
              <DeviceMaintenanceTab
                formData={formData}
                setFormData={setFormDataFn}
                contacts={contacts}
                contactsLoading={contactsLoading}
              />
            </TabsContent>

            <TabsContent value="consumables" className="mt-0 space-y-4">
              <DeviceConsumablesTab
                formData={formData}
                setFormData={setFormDataFn}
                contacts={contacts}
                contactsLoading={contactsLoading}
              />
            </TabsContent>

            <TabsContent value="instructions" className="mt-0 space-y-4">
              <DeviceInstructionsTab
                formData={formData}
                setFormData={setFormDataFn}
                practiceId={practiceId}
                editDeviceId={editDevice?.id}
                handbookFileName={handbookFileName}
                setHandbookFileName={setHandbookFileName}
                isUploadingHandbook={isUploadingHandbook}
                setIsUploadingHandbook={setIsUploadingHandbook}
                instructionDocuments={instructionDocuments}
                setInstructionDocuments={setInstructionDocuments}
              />
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <DeviceDetailsTab
                images={images}
                setImages={setImages}
                practiceId={practiceId}
              />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editDevice ? "Speichern" : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateDeviceDialog

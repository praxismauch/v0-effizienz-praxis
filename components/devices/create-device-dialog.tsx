"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { Loader2, X, FileText, Upload, Clipboard, Contact, ImageIcon, ExternalLink } from "lucide-react"
import { isActiveMember } from "@/lib/utils/team-member-filter"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { MultiImageUpload } from "@/components/ui/multi-image-upload"

interface Room {
  id: string
  name: string
  beschreibung?: string
}

interface ContactOption {
  id: string
  company: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  email: string | null
}

interface Department {
  id: string
  name: string
  color?: string
}

interface CreateDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editDevice?: any
}

const DEVICE_CATEGORIES = [
  { value: "diagnostik", label: "Diagnostik" },
  { value: "therapie", label: "Therapie" },
  { value: "labor", label: "Labor" },
  { value: "bildgebung", label: "Bildgebung" },
  { value: "chirurgie", label: "Chirurgie" },
  { value: "monitoring", label: "Monitoring" },
  { value: "it", label: "IT & EDV" },
  { value: "sonstiges", label: "Sonstiges" },
]

export function CreateDeviceDialog({ open, onOpenChange, onSuccess, editDevice }: CreateDeviceDialogProps) {
  const { currentPractice } = usePractice()
  const { teamMembers, loading: teamLoading } = useTeam()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [imageUploading, setImageUploading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  // Use Contact[] instead of ContactOption[]
  const [contacts, setContacts] = useState<ContactOption[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [showContactSelector, setShowContactSelector] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "diagnostik",
    manufacturer: "",
    model: "",
    serial_number: "",
    inventory_number: "",
    purchase_date: "",
    purchase_price: "",
    supplier_name: "",
    supplier_contact: "",
    warranty_end_date: "",
    location: "",
    room: "", // Keep for backwards compatibility
    responsible_user_id: "",
    image_url: "",
    handbook_url: "",
    maintenance_interval_days: "",
    last_maintenance_date: "",
    maintenance_service_partner: "",
    maintenance_service_contact: "",
    maintenance_service_phone: "",
    maintenance_service_email: "",
    consumables_supplier: "",
    consumables_order_url: "",
    consumables_notes: "",
    cleaning_instructions: "",
    maintenance_instructions: "",
    short_sop: "",
    status: "active",
    mpg_class: "",
    ce_marking: false,
    safety_relevant: false,
  })

  const imageInputRef = useRef<HTMLInputElement>(null)
  const handbookInputRef = useRef<HTMLInputElement>(null)
  const imageDropZoneRef = useRef<HTMLDivElement>(null)

  const practiceId = currentPractice?.id // Use this for consistent practice ID access

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
      if (response.ok) {
        const data = await response.json()
        setRooms(data)
      }
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
        // Filter to only show contacts that have company or name
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
        mpg_class: editDevice.mpg_class || "",
        ce_marking: editDevice.ce_marking || false,
        safety_relevant: editDevice.safety_relevant || false,
      })
      if (editDevice.image_url) {
        try {
          const parsed = JSON.parse(editDevice.image_url)
          if (Array.isArray(parsed)) {
            setImages(parsed)
          } else {
            setImages([editDevice.image_url])
          }
        } catch {
          setImages([editDevice.image_url])
        }
      }
      if (editDevice.room_ids && editDevice.room_ids.length > 0) {
        setSelectedRoomIds(editDevice.room_ids)
      } else {
        setSelectedRoomIds([])
      }
      if (editDevice.handbook_url) {
        const urlParts = editDevice.handbook_url.split("/")
        const fileName = urlParts[urlParts.length - 1]?.split("-").slice(1).join("-") || "Handbuch"
        setHandbookFileName(fileName)
      }
      // Load instruction documents if they exist
      if (editDevice.instruction_documents && Array.isArray(editDevice.instruction_documents)) {
        setInstructionDocuments(editDevice.instruction_documents)
      }
    } else {
      setFormData({
        name: "",
        description: "",
        category: "diagnostik",
        manufacturer: "",
        model: "",
        serial_number: "",
        inventory_number: "",
        purchase_date: "",
        purchase_price: "",
        supplier_name: "",
        supplier_contact: "",
        warranty_end_date: "",
        location: "",
        room: "",
        responsible_user_id: "",
        image_url: "",
        handbook_url: "",
        maintenance_interval_days: "",
        last_maintenance_date: "",
        maintenance_service_partner: "",
        maintenance_service_contact: "",
        maintenance_service_phone: "",
        maintenance_service_email: "",
        consumables_supplier: "",
        consumables_order_url: "",
        consumables_notes: "",
        cleaning_instructions: "",
        maintenance_instructions: "",
        short_sop: "",
        status: "active",
        mpg_class: "",
        ce_marking: false,
        safety_relevant: false,
      })
      setImages([])
      setSelectedRoomIds([])
      setHandbookFile(null)
      setHandbookFileName(null)
      setInstructionDocuments([])
      setIsUploadingInstructionDocs(false)
      setIsDraggingInstructionDocs(false)
    }
    setActiveTab("basic")
  }, [editDevice, open])

  const [handbookFile, setHandbookFile] = useState<File | null>(null)
  const [handbookFileName, setHandbookFileName] = useState<string | null>(null)
  const [isUploadingHandbook, setIsUploadingHandbook] = useState(false)
  const [isDraggingHandbook, setIsDraggingHandbook] = useState(false)

  const [instructionDocuments, setInstructionDocuments] = useState<
    Array<{
      id: string
      name: string
      url: string
      type: string
      size: number
    }>
  >([])
  const [isUploadingInstructionDocs, setIsUploadingInstructionDocs] = useState(false)
  const [isDraggingInstructionDocs, setIsDraggingInstructionDocs] = useState(false)

  const handleSubmit = async () => {
    console.log("[v0] Device submit started")
    console.log("[v0] Form data:", formData)
    console.log("[v0] Practice ID:", practiceId)
    console.log("[v0] Selected rooms:", selectedRoomIds)
    console.log("[v0] Images:", images)
    
    if (!formData.name.trim()) {
      console.log("[v0] Validation failed: empty device name")
      toast({ title: "Fehler", description: "Bitte geben Sie einen Gerätenamen ein.", variant: "destructive" })
      return
    }

    if (!practiceId) {
      console.log("[v0] No current practice ID found")
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
        maintenance_interval_days: formData.maintenance_interval_days
          ? Number.parseInt(formData.maintenance_interval_days)
          : null,
        room_ids: selectedRoomIds,
        // Convert other potentially empty string fields to null
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
        instruction_documents: instructionDocuments, // Include instruction documents
      }
      console.log("[v0] Submitting device:", { url, payload })

      const response = await fetch(url, {
        method: editDevice ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log("[v0] Device API response:", { status: response.status, data })

      if (response.ok) {
        console.log("[v0] Device save successful, calling onSuccess")
        toast({
          title: editDevice ? "Gerät aktualisiert" : "Gerät erstellt",
          description: editDevice
            ? "Das Gerät wurde erfolgreich aktualisiert."
            : "Das Gerät wurde erfolgreich erstellt.",
        })
        onOpenChange(false)
        onSuccess()
      } else {
        const errorMessage = data?.error || "Unbekannter Fehler"
        console.error("[v0] Device save error:", errorMessage)
        console.error("[v0] Full error response:", data)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("[v0] Device save exception:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Das Gerät konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds((prev) => (prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]))
  }



  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!practiceId) {
        toast({
          title: "Fehler",
          description: "Keine Praxis ausgewählt",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Fehler",
          description: "Bitte wählen Sie eine Bilddatei aus.",
          variant: "destructive",
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fehler",
          description: "Das Bild darf maximal 5MB groß sein.",
          variant: "destructive",
        })
        return
      }

      setImageUploading(true)

      try {
        const uploadFormData = new FormData()
        uploadFormData.append("file", file)

        const response = await fetch(`/api/practices/${practiceId}/devices/upload-image`, {
          method: "POST",
          body: uploadFormData,
        })

        if (response.ok) {
          const data = await response.json()
          setImages((prev) => [...prev, data.url])
          toast({
            title: "Erfolg",
            description: "Bild wurde hochgeladen",
          })
        } else {
          const error = await response.json()
          toast({
            title: "Fehler",
            description: error.error || "Upload fehlgeschlagen",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Fehler",
          description: "Upload fehlgeschlagen",
          variant: "destructive",
        })
      } finally {
        setImageUploading(false)
      }
    },
    [practiceId],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach((file) => handleImageUpload(file))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          handleImageUpload(file)
        }
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index]

    try {
      if (imageUrl.includes("blob.vercel-storage.com")) {
        await fetch(`/api/practices/${practiceId}/devices/upload-image`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: imageUrl }),
        })
      }
    } catch (error) {
      console.error("Error deleting image:", error)
    }

    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent | ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            await handleImageUpload(file)
          }
        }
      }
    },
    [handleImageUpload],
  )

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (
        document.activeElement === imageDropZoneRef.current ||
        imageDropZoneRef.current?.contains(document.activeElement as Node)
      ) {
        handlePaste(e)
      }
    }

    document.addEventListener("paste", handleGlobalPaste)
    return () => document.removeEventListener("paste", handleGlobalPaste)
  }, [handlePaste])

  const handleHandbookDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingHandbook(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      const validExtensions = [".pdf", ".doc", ".docx"]
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`

      if (validTypes.includes(file.type) || validExtensions.includes(extension)) {
        uploadHandbook(file)
      } else {
        toast({
          title: "Ungültiges Dateiformat",
          description: "Bitte laden Sie eine PDF-Datei oder Word-Datei hoch (.pdf, .doc, .docx)",
          variant: "destructive",
        })
      }
    }
  }, [])

  const handleHandbookSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadHandbook(file)
    }
  }, [])

  const uploadHandbook = async (file: File) => {
    if (!practiceId) return

    setIsUploadingHandbook(true)
    setHandbookFile(file)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      if (formData.handbook_url) {
        uploadFormData.append("oldHandbookUrl", formData.handbook_url)
      }

      const response = await fetch(`/api/practices/${practiceId}/devices/upload-handbook`, {
        method: "POST",
        body: uploadFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload fehlgeschlagen")
      }

      const data = await response.json()
      setFormData((prev) => ({ ...prev, handbook_url: data.url }))
      setHandbookFileName(file.name)

      toast({
        title: "Handbuch hochgeladen",
        description: `${file.name} wurde erfolgreich hochgeladen`,
      })
    } catch (error: any) {
      console.error("Error uploading handbook:", error)
      toast({
        title: "Fehler beim Hochladen",
        description: error.message || "Das Handbuch konnte nicht hochgeladen werden",
        variant: "destructive",
      })
      setHandbookFile(null)
    } finally {
      setIsUploadingHandbook(false)
    }
  }

  const removeHandbook = async () => {
    if (formData.handbook_url && practiceId) {
      try {
        await fetch(`/api/practices/${practiceId}/devices/upload-handbook`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: formData.handbook_url }),
        })
      } catch (error) {
        console.error("Error deleting handbook:", error)
      }
    }
    setFormData((prev) => ({ ...prev, handbook_url: "" }))
    setHandbookFile(null)
    setHandbookFileName(null)
    if (handbookInputRef.current) {
      handbookInputRef.current.value = ""
    }
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

  const handleInstructionDocsUpload = async (files: FileList | File[]) => {
    if (!currentPractice?.id) return

    setIsUploadingInstructionDocs(true)
    const fileArray = Array.from(files)

    try {
      for (const file of fileArray) {
        // Validate file type (PDFs, Word docs, images)
        const allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/jpeg",
          "image/png",
          "image/gif",
        ]

        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Ungültiger Dateityp",
            description: `${file.name} ist kein unterstütztes Format (PDF, Word, Bilder)`,
            variant: "destructive",
          })
          continue
        }

        // Max 10MB per file
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Datei zu groß",
            description: `${file.name} ist größer als 10MB`,
            variant: "destructive",
          })
          continue
        }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", "general")
        formData.append("practiceId", currentPractice.id)

        const response = await fetch("/api/upload/unified", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setInstructionDocuments((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              name: file.name,
              url: data.url,
              type: file.type,
              size: file.size,
            },
          ])
        } else {
          toast({
            title: "Upload fehlgeschlagen",
            description: `Fehler beim Hochladen von ${file.name}`,
            variant: "destructive",
          })
        }
      }

      toast({
        title: "Dokumente hochgeladen",
        description: `${fileArray.length} Datei(en) erfolgreich hochgeladen`,
      })
    } catch (error) {
      console.error("Error uploading instruction documents:", error)
      toast({
        title: "Upload fehlgeschlagen",
        description: "Fehler beim Hochladen der Dokumente",
        variant: "destructive",
      })
    } finally {
      setIsUploadingInstructionDocs(false)
    }
  }

  // Function to handle instruction document uploads
  const handleInstructionDocUpload = useCallback(
    async (file: File) => {
      if (!practiceId) {
        toast({ title: "Fehler", description: "Keine Praxis ausgewählt", variant: "destructive" })
        return
      }

      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      const validExtensions = [".pdf", ".doc", ".docx"]
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`

      if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
        toast({
          title: "Ungültiges Dateiformat",
          description: "Nur PDF und Word-Dateien erlaubt.",
          variant: "destructive",
        })
        return
      }

      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        toast({ title: "Fehler", description: "Datei ist zu groß (max. 50MB).", variant: "destructive" })
        return
      }

      setIsUploadingInstructionDocs(true)

      try {
        const uploadFormData = new FormData()
        uploadFormData.append("file", file)
        if (editDevice?.id) {
          // Pass device ID if editing
          uploadFormData.append("deviceId", editDevice.id)
        }

        const response = await fetch(`/api/practices/${practiceId}/devices/upload-instruction-doc`, {
          method: "POST",
          body: uploadFormData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Upload fehlgeschlagen")
        }

        const data = await response.json()
        setInstructionDocuments((prev) => [...prev, { ...data, type: file.type, size: file.size }])

        toast({ title: "Erfolg", description: `"${file.name}" wurde hochgeladen.` })
      } catch (error: any) {
        console.error("Error uploading instruction document:", error)
        toast({
          title: "Fehler",
          description: error.message || "Dokument konnte nicht hochgeladen werden.",
          variant: "destructive",
        })
      } finally {
        setIsUploadingInstructionDocs(false)
      }
    },
    [practiceId, editDevice?.id],
  )

  const handleInstructionDocDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDraggingInstructionDocs(false)
      const files = e.dataTransfer.files
      if (files) {
        Array.from(files).forEach((file) => handleInstructionDocUpload(file))
      }
    },
    [handleInstructionDocUpload],
  )

  const handleInstructionDocSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files) {
        Array.from(files).forEach((file) => handleInstructionDocUpload(file))
      }
    },
    [handleInstructionDocUpload],
  )

  const removeInstructionDoc = async (docUrl: string, index: number) => {
    setIsUploadingInstructionDocs(true) // Use this state to indicate deletion in progress too
    try {
      await fetch(`/api/practices/${practiceId}/devices/upload-instruction-doc`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: docUrl, deviceId: editDevice?.id }),
      })
      setInstructionDocuments((prev) => prev.filter((_, i) => i !== index))
      toast({ title: "Erfolg", description: "Dokument wurde entfernt." })
    } catch (error: any) {
      console.error("Error deleting instruction document:", error)
      toast({
        title: "Fehler",
        description: error.message || "Dokument konnte nicht entfernt werden.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingInstructionDocs(false)
    }
  }

  const removeInstructionDocument = (id: string) => {
    setInstructionDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  const handleInstructionDocsPaste = async (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files)
    if (files.length > 0) {
      e.preventDefault()
      await handleInstructionDocsUpload(files)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editDevice ? "Gerät bearbeiten" : "Neues Gerät"}</DialogTitle>
          <DialogDescription>
            {editDevice
              ? "Bearbeiten Sie die Informationen des Geräts"
              : "Fügen Sie ein neues medizinisches Gerät hinzu"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basis</TabsTrigger>
            <TabsTrigger value="purchase">Kauf</TabsTrigger>
            <TabsTrigger value="maintenance">Wartung</TabsTrigger>
            <TabsTrigger value="consumables">Verbrauch</TabsTrigger>
            <TabsTrigger value="instructions">Anleitungen</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4">
            <TabsContent value="basic" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Gerätename *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. EKG-Gerät"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Beschreibung</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Kurze Beschreibung des Geräts"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Kategorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEVICE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="maintenance">In Wartung</SelectItem>
                      <SelectItem value="defect">Defekt</SelectItem>
                      <SelectItem value="inactive">Inaktiv</SelectItem>
                      <SelectItem value="disposed">Entsorgt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hersteller</Label>
                  <Input
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="z.B. Philips"
                  />
                </div>
                <div>
                  <Label>Modell</Label>
                  <Input
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="z.B. PageWriter TC70"
                  />
                </div>
                <div>
                  <Label>Seriennummer</Label>
                  <Input
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    placeholder="Seriennummer"
                  />
                </div>
                <div>
                  <Label>Inventarnummer</Label>
                  <Input
                    value={formData.inventory_number}
                    onChange={(e) => setFormData({ ...formData, inventory_number: e.target.value })}
                    placeholder="Interne Inventarnummer"
                  />
                </div>
                <div>
                  <Label>Abteilung</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) => setFormData({ ...formData, location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Abteilung wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keine Auswahl</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          <div className="flex items-center gap-2">
                            {dept.color && (
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                            )}
                            {dept.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Räume</Label>
                  {selectedRoomIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedRoomIds.map((roomId) => {
                        const room = rooms.find((r) => r.id === roomId)
                        return room ? (
                          <Badge key={roomId} variant="secondary" className="flex items-center gap-1">
                            {room.name}
                            <button
                              type="button"
                              onClick={() => toggleRoom(roomId)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null
                      })}
                    </div>
                  )}
                  {rooms.length > 0 ? (
                    <ScrollArea className="h-32 border rounded-md p-2">
                      <div className="space-y-2">
                        {rooms.map((room) => (
                          <div key={room.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`room-${room.id}`}
                              checked={selectedRoomIds.includes(room.id)}
                              onCheckedChange={() => toggleRoom(room.id)}
                            />
                            <label htmlFor={`room-${room.id}`} className="text-sm cursor-pointer flex-1">
                              {room.name}
                              {room.beschreibung && (
                                <span className="text-muted-foreground ml-2 text-xs">({room.beschreibung})</span>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Keine Räume verfügbar. Erstellen Sie zuerst Räume unter Räume-Verwaltung.
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <Label>Verantwortliche Person</Label>
                  <Select
                    value={formData.responsible_user_id || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, responsible_user_id: value === "none" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={teamLoading ? "Laden..." : "Verantwortlichen auswählen"} />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-[300px]">
                      <SelectItem value="none">Keine Auswahl</SelectItem>
                      {teamMembers.filter(isActiveMember).map((member) => {
                        const memberId = member.user_id || member.id
                        if (!memberId) return null
                        const displayName = `${member.firstName || member.first_name || ""} ${member.lastName || member.last_name || ""}`.trim() || member.email || "Unbekannt"
                        return (
                          <SelectItem key={memberId} value={memberId}>
                            {displayName}
                          </SelectItem>
                        )
                      })}
                      {teamMembers.filter(isActiveMember).length === 0 && !teamLoading && (
                        <SelectItem value="no-members" disabled>
                          Keine Teammitglieder verfügbar
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Gerätebilder
                  </Label>
                  <p className="text-xs text-muted-foreground">Laden Sie Bilder des Geräts hoch (max. 10 Bilder)</p>
                  <MultiImageUpload
                    images={images}
                    onImagesChange={setImages}
                    maxImages={10}
                    uploadEndpoint={practiceId ? `/api/practices/${practiceId}/devices/upload-image` : ""}
                    disabled={loading || !practiceId}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="purchase" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Kaufdatum</Label>
                  <Input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Kaufpreis (EUR)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Lieferant</Label>
                  <Input
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    placeholder="Name des Lieferanten"
                  />
                </div>
                <div>
                  <Label>Lieferant Kontakt</Label>
                  <Input
                    value={formData.supplier_contact}
                    onChange={(e) => setFormData({ ...formData, supplier_contact: e.target.value })}
                    placeholder="Telefon oder E-Mail"
                  />
                </div>
                <div>
                  <Label>Garantie bis</Label>
                  <Input
                    type="date"
                    value={formData.warranty_end_date}
                    onChange={(e) => setFormData({ ...formData, warranty_end_date: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="maintenance" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Wartungsintervall (Tage)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.maintenance_interval_days}
                    onChange={(e) => setFormData({ ...formData, maintenance_interval_days: e.target.value })}
                    placeholder="z.B. 365"
                  />
                </div>
                <div>
                  <Label>Letzte Wartung</Label>
                  <Input
                    type="date"
                    value={formData.last_maintenance_date}
                    onChange={(e) => setFormData({ ...formData, last_maintenance_date: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Servicepartner</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowContactSelector(!showContactSelector)}
                      className="h-7 text-xs gap-1"
                    >
                      <Contact className="h-3 w-3" />
                      Aus Kontakten wählen
                    </Button>
                  </div>

                  {showContactSelector && (
                    <div className="mb-3 p-3 border rounded-lg bg-muted/30">
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Kontakt auswählen zum Übernehmen der Daten
                      </Label>
                      {contactsLoading ? (
                        <div className="text-sm text-muted-foreground py-2">Laden...</div>
                      ) : contacts.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-2">Keine Kontakte vorhanden</div>
                      ) : (
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {contacts.map((contact) => (
                            <button
                              key={contact.id}
                              type="button"
                              onClick={() => handleContactSelect(contact)}
                              className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm"
                            >
                              <div className="font-medium">
                                {contact.company || `${contact.first_name || ""} ${contact.last_name || ""}`.trim()}
                              </div>
                              {contact.company && (contact.first_name || contact.last_name) && (
                                <div className="text-xs text-muted-foreground">
                                  {`${contact.first_name || ""} ${contact.last_name || ""}`.trim()}
                                </div>
                              )}
                              {contact.email && <div className="text-xs text-muted-foreground">{contact.email}</div>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <Input
                    value={formData.maintenance_service_partner}
                    onChange={(e) => setFormData({ ...formData, maintenance_service_partner: e.target.value })}
                    placeholder="Name des Servicepartners"
                  />
                </div>
                <div>
                  <Label>Ansprechpartner</Label>
                  <Input
                    value={formData.maintenance_service_contact}
                    onChange={(e) => setFormData({ ...formData, maintenance_service_contact: e.target.value })}
                    placeholder="Name"
                  />
                </div>
                <div>
                  <Label>Telefon</Label>
                  <Input
                    value={formData.maintenance_service_phone}
                    onChange={(e) => setFormData({ ...formData, maintenance_service_phone: e.target.value })}
                    placeholder="Telefonnummer"
                  />
                </div>
                <div className="col-span-2">
                  <Label>E-Mail</Label>
                  <Input
                    type="email"
                    value={formData.maintenance_service_email}
                    onChange={(e) => setFormData({ ...formData, maintenance_service_email: e.target.value })}
                    placeholder="service@example.com"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Kontakt auswählen</Label>
                  <Button
                    type="button"
                    onClick={() => setShowContactSelector(true)}
                    disabled={contactsLoading}
                    className="flex items-center gap-2"
                  >
                    <Contact className="h-4 w-4" />
                    Kontakt auswählen
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="consumables" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Verbrauchsmaterial-Lieferant</Label>
                  <Input
                    value={formData.consumables_supplier}
                    onChange={(e) => setFormData({ ...formData, consumables_supplier: e.target.value })}
                    placeholder="Name des Lieferanten"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Bestell-URL</Label>
                  <Input
                    value={formData.consumables_order_url}
                    onChange={(e) => setFormData({ ...formData, consumables_order_url: e.target.value })}
                    placeholder="Link zur Bestellseite"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Hinweise zu Verbrauchsmaterial</Label>
                  <Textarea
                    value={formData.consumables_notes}
                    onChange={(e) => setFormData({ ...formData, consumables_notes: e.target.value })}
                    placeholder="z.B. Artikelnummern, Bestellmengen, etc."
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="instructions" className="mt-0 space-y-4">
              <div className="space-y-4">
                {/* Handbuch Upload Section */}
                <div className="space-y-2">
                  <Label>Handbuch (PDF/Word)</Label>
                  <input
                    type="file"
                    ref={handbookInputRef}
                    onChange={handleHandbookSelect}
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                  />

                  {formData.handbook_url || handbookFileName ? (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{handbookFileName || "Handbuch"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formData.handbook_url ? "Hochgeladen" : "Wird hochgeladen..."}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {formData.handbook_url && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(formData.handbook_url, "_blank")}
                          >
                            Öffnen
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={removeHandbook}
                          disabled={isUploadingHandbook}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`
                        relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                        transition-colors duration-200
                        ${
                          isDraggingHandbook
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                        }
                        ${isUploadingHandbook ? "pointer-events-none opacity-50" : ""}
                      `}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDraggingHandbook(true)
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault()
                        setIsDraggingHandbook(false)
                      }}
                      onDrop={handleHandbookDrop}
                      onClick={() => handbookInputRef.current?.click()}
                    >
                      {isUploadingHandbook ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Handbuch hochladen</p>
                            <p className="text-xs text-muted-foreground">
                              PDF oder Word-Datei hierher ziehen oder klicken
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">Max. 50 MB</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* ADDED DOCUMENT UPLOAD SECTION */}
                <div>
                  <Label className="mb-2 block">Dokumente hochladen</Label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer",
                      isDraggingInstructionDocs
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50",
                    )}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDraggingInstructionDocs(true)
                    }}
                    onDragLeave={() => setIsDraggingInstructionDocs(false)}
                    onDrop={async (e) => {
                      e.preventDefault()
                      setIsDraggingInstructionDocs(false)
                      await handleInstructionDocsUpload(e.dataTransfer.files)
                    }}
                    onPaste={handleInstructionDocsPaste}
                    onClick={() => {
                      const input = document.createElement("input")
                      input.type = "file"
                      input.multiple = true
                      input.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                      input.onchange = async (e) => {
                        const files = (e.target as HTMLInputElement).files
                        if (files) await handleInstructionDocsUpload(files)
                      }
                      input.click()
                    }}
                    tabIndex={0}
                  >
                    {isUploadingInstructionDocs ? (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Wird hochgeladen...</span>
                      </div>
                    ) : (
                      <div className="py-2">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Dateien hier ablegen, einfügen (Strg+V) oder klicken
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, Word, Bilder (max. 10MB pro Datei)</p>
                      </div>
                    )}
                  </div>

                  {/* Uploaded documents list */}
                  {instructionDocuments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {instructionDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 min-w-0">
                            {doc.type === "application/pdf" ? (
                              <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                            ) : doc.type.startsWith("image/") ? (
                              <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            )}
                            <span className="text-sm truncate">{doc.name}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              ({(doc.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(doc.url, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeInstructionDocument(doc.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <Label>Kurze Bedienungsanleitung (SOP)</Label>
                  <Textarea
                    value={formData.short_sop}
                    onChange={(e) => setFormData({ ...formData, short_sop: e.target.value })}
                    placeholder="Wichtigste Schritte zur Bedienung"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Reinigungsanleitung</Label>
                  <Textarea
                    value={formData.cleaning_instructions}
                    onChange={(e) => setFormData({ ...formData, cleaning_instructions: e.target.value })}
                    placeholder="Anleitung zur Reinigung und Desinfektion"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Wartungsanleitung</Label>
                  <Textarea
                    value={formData.maintenance_instructions}
                    onChange={(e) => setFormData({ ...formData, maintenance_instructions: e.target.value })}
                    placeholder="Regelmäßige Wartungsarbeiten"
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="space-y-2">
                {/* <Label>Gerätebild</Label> */}
                <div
                  ref={imageDropZoneRef}
                  tabIndex={0}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onPaste={handlePaste}
                  onClick={() => imageInputRef.current?.click()}
                  className={`
                    mt-1.5 border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    ${
                      isDragOver
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                    }
                  `}
                >
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {imageUploading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Bild wird hochgeladen...</span>
                    </div>
                  ) : images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="flex items-center gap-2 mb-2">
                        <Clipboard className="h-5 w-5 text-muted-foreground" />
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Bilder hier einfügen oder ablegen</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Strg</kbd>
                        {" + "}
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">V</kbd>
                        {" zum Einfügen oder Drag & Drop"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, GIF bis 5MB · Mehrere Bilder möglich
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-2">
                        {images.map((url, index) => (
                          <div key={index} className="relative group aspect-square">
                            <img
                              src={url || "/placeholder.svg"}
                              alt={`Gerätebild ${index + 1}`}
                              className="w-full h-full object-cover rounded-md border"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveImage(index)
                              }}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {/* Add more button */}
                        <div className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-md flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:bg-muted/50 transition-colors">
                          <Upload className="h-4 w-4 mb-1" />
                          <span className="text-xs">Mehr</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Klicken oder <kbd className="px-1 py-0.5 bg-muted rounded text-xs font-mono">Strg+V</kbd> für
                        weitere Bilder
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {showContactSelector && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
              <DialogHeader>
                <DialogTitle>Kontakt auswählen</DialogTitle>
              </DialogHeader>
              {contactsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Kontakte werden geladen...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <Button
                      key={contact.id}
                      onClick={() => handleContactSelect(contact)}
                      className="flex items-center gap-2"
                    >
                      <Contact className="h-4 w-4" />
                      {contact.company || `${contact.first_name || ""} ${contact.last_name || ""}`.trim()}
                    </Button>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => setShowContactSelector(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
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

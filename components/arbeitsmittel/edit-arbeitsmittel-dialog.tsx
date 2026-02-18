"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { type ArbeitsmittelFormData, EMPTY_FORM_DATA } from "./shared"
import { ArbeitsmittelFormFields } from "./arbeitsmittel-form-fields"

interface EditArbeitsmittelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  item: any
  teamMembers: any[]
}

export function EditArbeitsmittelDialog({
  open,
  onOpenChange,
  onSuccess,
  item,
  teamMembers,
}: EditArbeitsmittelDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ArbeitsmittelFormData>({ ...EMPTY_FORM_DATA })
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        type: item.type || "",
        description: item.description || "",
        serial_number: item.serial_number || "",
        purchase_date: item.purchase_date || "",
        purchase_price: item.purchase_price?.toString() || "",
        condition: item.condition || "Neu",
        assigned_to: item.assigned_to || "",
        status: item.status || "available",
        notes: item.notes || "",
      })
      setImageUrl(item.image_url || null)
    }
  }, [item])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (!item.practice_id) throw new Error("No practice ID")

      const response = await fetch(`/api/practices/${item.practice_id}/arbeitsmittel/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          description: formData.description || null,
          serial_number: formData.serial_number || null,
          purchase_date: formData.purchase_date || null,
          purchase_price: formData.purchase_price ? Number.parseFloat(formData.purchase_price) : null,
          condition: formData.condition,
          status: formData.status,
          notes: formData.notes || null,
          assigned_to: formData.assigned_to || null,
          assigned_date:
            formData.assigned_to && !item.assigned_to ? new Date().toISOString().split("T")[0] : item.assigned_date,
          return_date:
            !formData.assigned_to && item.assigned_to ? new Date().toISOString().split("T")[0] : item.return_date,
          image_url: imageUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update")
      }

      toast({ title: "Erfolgreich", description: "Arbeitsmittel wurde aktualisiert." })
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating arbeitsmittel:", error)
      toast({
        title: "Fehler",
        description: error?.message || "Fehler beim Aktualisieren des Arbeitsmittels",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Arbeitsmittel bearbeiten</DialogTitle>
          <DialogDescription>Aktualisieren Sie die Details des Arbeitsmittels</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ArbeitsmittelFormFields
            formData={formData}
            onChange={setFormData}
            teamMembers={teamMembers}
            imageUrl={imageUrl}
            onImageChange={setImageUrl}
            uploadEndpoint={`/api/practices/${item?.practice_id}/arbeitsmittel/upload-image`}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.type}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

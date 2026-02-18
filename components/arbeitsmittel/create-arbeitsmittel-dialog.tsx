"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { usePractice } from "@/contexts/practice-context"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { type ArbeitsmittelFormData, EMPTY_FORM_DATA } from "./shared"
import { ArbeitsmittelFormFields } from "./arbeitsmittel-form-fields"

interface CreateArbeitsmittelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  teamMembers: any[]
}

export function CreateArbeitsmittelDialog({
  open,
  onOpenChange,
  onSuccess,
  teamMembers,
}: CreateArbeitsmittelDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ArbeitsmittelFormData>({ ...EMPTY_FORM_DATA })
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const { currentPractice } = usePractice()
  const { user } = useAuth()
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPractice?.id) return

    setLoading(true)
    try {
      const response = await fetch("/api/arbeitsmittel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          practice_id: currentPractice.id,
          purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
          assigned_to: formData.assigned_to === "none" ? null : formData.assigned_to || null,
          image_url: imageUrl,
          created_by: user?.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create")
      }

      toast({ title: "Erfolgreich", description: "Arbeitsmittel wurde erstellt." })
      onSuccess()
      onOpenChange(false)
      setFormData({ ...EMPTY_FORM_DATA })
      setImageUrl(null)
    } catch (error: any) {
      console.error("Error creating arbeitsmittel:", error)
      toast({
        title: "Fehler",
        description: error?.message || "Fehler beim Erstellen des Arbeitsmittels",
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
          <DialogTitle>Arbeitsmittel hinzufuegen</DialogTitle>
          <DialogDescription>
            Fuegen Sie ein neues Arbeitsmittel wie Schluessel, Dienstkleidung oder Geraete hinzu
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ArbeitsmittelFormFields
            formData={formData}
            onChange={setFormData}
            teamMembers={teamMembers}
            imageUrl={imageUrl}
            onImageChange={setImageUrl}
            uploadEndpoint={`/api/arbeitsmittel/upload?practiceId=${currentPractice?.id}`}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.type}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

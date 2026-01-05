"use client"

import { useState } from "react"
import { Loader2, MapPin, Briefcase, Save } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"

interface CompetitorAnalysis {
  id: string
  practice_id: string
  location: string
  specialty: string
  radius_km: number
  title: string
  summary: string
}

interface EditCompetitorAnalysisDialogProps {
  analysis: CompetitorAnalysis
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditCompetitorAnalysisDialog({
  analysis,
  open,
  onOpenChange,
  onSuccess,
}: EditCompetitorAnalysisDialogProps) {
  const { currentPractice } = useUser()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: analysis.title,
    location: analysis.location,
    specialty: analysis.specialty,
    radius_km: analysis.radius_km,
    summary: analysis.summary || "",
  })

  const handleSubmit = async () => {
    if (!currentPractice?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/competitor-analysis/${analysis.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: "Analyse wurde aktualisiert",
        })
        onSuccess()
      } else {
        throw new Error("Update failed")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Analyse konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Konkurrenzanalyse bearbeiten</DialogTitle>
          <DialogDescription>Bearbeiten Sie die Metadaten und Zusammenfassung dieser Analyse</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Ort / Region
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty" className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                Fachrichtung
              </Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Zusammenfassung</Label>
            <Textarea
              id="summary"
              rows={6}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Executive Summary der Analyse..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditCompetitorAnalysisDialog

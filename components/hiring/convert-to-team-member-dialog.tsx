"use client"

import { useState } from "react"
import { usePractice } from "@/contexts/practice-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, UserPlus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Candidate {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth?: string
  current_position: string
  current_company?: string
}

interface ConvertToTeamMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidate: Candidate
  onSuccess: () => void
}

function ConvertToTeamMemberDialog({ open, onOpenChange, candidate, onSuccess }: ConvertToTeamMemberDialogProps) {
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    role: candidate.current_position || "",
    department: "",
    status: "active",
    joined_date: new Date().toISOString().split("T")[0],
    notes: `Konvertiert von Kandidat ${candidate.first_name} ${candidate.last_name}`,
  })

  const handleConvert = async () => {
    if (!currentPractice?.id) {
      toast({
        title: "Fehler",
        description: "Keine Praxis ausgewählt",
        variant: "destructive",
      })
      return
    }

    if (!formData.role) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Rolle ein",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      console.log("[v0] Converting candidate:", candidate.id)

      // Call API to convert candidate to team member
      const response = await fetch(`/api/hiring/candidates/${candidate.id}/convert-to-team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId: currentPractice.id,
          role: formData.role,
          department: formData.department,
          status: formData.status,
          joined_date: formData.joined_date,
          notes: formData.notes,
        }),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response ok:", response.ok)
      console.log("[v0] Response content-type:", response.headers.get("content-type"))

      let result
      const contentType = response.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
        console.log("[v0] Response data:", result)
      } else {
        const text = await response.text()
        console.error("[v0] Non-JSON response:", text.substring(0, 200))
        throw new Error("Server returned non-JSON response")
      }

      if (response.ok) {
        toast({
          title: "Erfolgreich konvertiert",
          description: `${candidate.first_name} ${candidate.last_name} wurde erfolgreich zum Team-Mitglied hinzugefügt und archiviert.`,
        })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          title: "Fehler",
          description: result?.error || "Konvertierung fehlgeschlagen",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error converting candidate:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Ein unerwarteter Fehler ist aufgetreten",
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
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            Kandidat zu Team-Mitglied konvertieren
          </DialogTitle>
          <DialogDescription>
            Möchten Sie{" "}
            <strong>
              {candidate.first_name} {candidate.last_name}
            </strong>{" "}
            wirklich zum Team-Mitglied machen? Der Kandidat wird archiviert und als Team-Mitglied hinzugefügt.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Diese Aktion erstellt einen neuen Team-Eintrag und archiviert den Kandidaten. Die Kandidatendaten bleiben
            erhalten.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vorname</Label>
              <Input value={candidate.first_name} disabled />
            </div>
            <div>
              <Label>Nachname</Label>
              <Input value={candidate.last_name} disabled />
            </div>
          </div>

          <div>
            <Label>E-Mail</Label>
            <Input value={candidate.email} disabled />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Rolle / Position *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="z.B. MFA, Arzt, Verwaltung"
              />
            </div>
            <div>
              <Label htmlFor="department">Abteilung</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="z.B. Empfang, Labor"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                  <SelectItem value="on_leave">Beurlaubt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="joined_date">Eintrittsdatum</Label>
              <Input
                id="joined_date"
                type="date"
                value={formData.joined_date}
                onChange={(e) => setFormData({ ...formData, joined_date: e.target.value })}
              />
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Abbrechen
          </Button>
          <Button onClick={handleConvert} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "Wird konvertiert..." : "Zu Team-Mitglied konvertieren"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ConvertToTeamMemberDialog }
export default ConvertToTeamMemberDialog

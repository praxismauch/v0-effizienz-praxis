"use client"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePractice } from "@/contexts/practice-context"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Position {
  id: string
  position_title: string
  department: string
  user_id: string | null
  reports_to_position_id: string | null
  level: number
  is_management: boolean
  display_order: number
  color?: string
}

interface TeamMember {
  id: string
  first_name: string
  last_name: string
}

interface FormData {
  position_title: string
  department: string
  user_id: string
  reports_to_position_id: string
  level: number
  is_management: boolean
  display_order: number
  color: string
}

interface OrgChartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  position: Position | null
  positions: Position[]
  teamMembers: TeamMember[]
  formData: FormData
  setFormData: (data: FormData) => void
  onSuccess: () => void
}

export function OrgChartDialog({
  open,
  onOpenChange,
  position,
  positions,
  teamMembers,
  formData,
  setFormData,
  onSuccess,
}: OrgChartDialogProps) {
  const { currentPractice } = usePractice()
  const { toast } = useToast()

  const handleSave = async () => {
    if (!currentPractice?.id) return

    const supabase = createBrowserClient()

    try {
      const dataToSave = {
        position_title: formData.position_title,
        department: formData.department,
        user_id: formData.user_id === "none" ? null : formData.user_id,
        reports_to_position_id: formData.reports_to_position_id === "none" ? null : formData.reports_to_position_id,
        level: formData.level,
        is_management: formData.is_management,
        display_order: formData.display_order,
        color: formData.color,
        practice_id: currentPractice.id,
      }

      if (position) {
        // Update existing position
        const { error } = await supabase
          .from("org_chart_positions")
          .update(dataToSave)
          .eq("id", position.id)
          .eq("practice_id", currentPractice.id)

        if (error) throw error

        toast({
          title: "Erfolg",
          description: "Position wurde aktualisiert",
        })
      } else {
        // Create new position
        const { error } = await supabase.from("org_chart_positions").insert(dataToSave)

        if (error) throw error

        toast({
          title: "Erfolg",
          description: "Position wurde erstellt",
        })
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving position:", error)
      toast({
        title: "Fehler",
        description: "Position konnte nicht gespeichert werden",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{position ? "Position bearbeiten" : "Neue Position hinzufügen"}</DialogTitle>
          <DialogDescription>
            {position ? "Aktualisieren Sie die Positionsdetails" : "Erstellen Sie eine neue Position im Organigramm"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Positionstitel</Label>
            <Input
              value={formData.position_title}
              onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
              placeholder="z.B. Praxismanager"
            />
          </div>

          <div>
            <Label>Farbe</Label>
            <Input
              type="color"
              value={formData.color || "#3b82f6"}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>

          <div>
            <Label>Abteilung (optional)</Label>
            <Input
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="z.B. Verwaltung, Behandlung"
            />
          </div>

          <div>
            <Label>Person zuweisen (optional)</Label>
            <Select value={formData.user_id} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Keine Person zugewiesen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Person zugewiesen</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Berichtet an</Label>
            <Select
              value={formData.reports_to_position_id}
              onValueChange={(value) => setFormData({ ...formData, reports_to_position_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Keine übergeordnete Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine übergeordnete Position (Top-Level)</SelectItem>
                {positions
                  .filter((pos) => !position || pos.id !== position.id)
                  .map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.position_title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default OrgChartDialog

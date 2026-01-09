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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { isActiveMember } from "@/lib/utils/team-member-filter"
import { Link2, ClipboardList } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Responsibility {
  id: string
  name: string
  description?: string
  responsible_user_id?: string
  responsible_user_name?: string
}

interface CreateTodoFromResponsibilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  responsibility: Responsibility
  onSuccess?: () => void
}

export function CreateTodoFromResponsibilityDialog({
  open,
  onOpenChange,
  responsibility,
  onSuccess,
}: CreateTodoFromResponsibilityDialogProps) {
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    due_date: "",
    dringend: false,
    wichtig: false,
  })

  // Pre-fill form when dialog opens
  useEffect(() => {
    if (open && responsibility) {
      setFormData({
        title: `Aufgabe zu: ${responsibility.name}`,
        description: responsibility.description || "",
        priority: "medium",
        due_date: "",
        dringend: false,
        wichtig: false,
      })
      // Pre-assign to responsible user if available
      if (responsibility.responsible_user_id) {
        setAssignedUserIds([responsibility.responsible_user_id])
      } else {
        setAssignedUserIds([])
      }
    }
  }, [open, responsibility])

  // Fetch team members when dialog opens
  useEffect(() => {
    if (open && currentPractice?.id) {
      fetch(`/api/practices/${currentPractice.id}/team-members`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
          return res.json()
        })
        .then((data) => {
          setTeamMembers(Array.isArray(data) ? data : [])
        })
        .catch((err) => {
          console.error("[v0] Error fetching team members:", err)
          setTeamMembers([])
        })
    }
  }, [open, currentPractice?.id])

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Titel ein",
        variant: "destructive",
      })
      return
    }

    if (!currentPractice?.id) {
      toast({
        title: "Fehler",
        description: "Keine Praxis ausgewählt",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const todoData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        due_date: formData.due_date || null,
        dringend: formData.dringend,
        wichtig: formData.wichtig,
        assigned_user_ids: assignedUserIds,
        completed: false,
        responsibility_id: responsibility.id, // Link to responsibility
      }

      const response = await fetch(`/api/practices/${currentPractice.id}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todoData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Fehler beim Erstellen")
      }

      toast({
        title: "Erfolg",
        description: "Aufgabe wurde erstellt und mit der Zuständigkeit verknüpft",
      })

      // Reset form
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
        dringend: false,
        wichtig: false,
      })
      setAssignedUserIds([])
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("[v0] Error creating linked todo:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Aufgabe konnte nicht erstellt werden",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Aufgabe aus Zuständigkeit erstellen
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie eine neue Aufgabe, die mit dieser Zuständigkeit verknüpft ist.
          </DialogDescription>
        </DialogHeader>

        {/* Linked Responsibility Info */}
        <div className="bg-muted/50 rounded-lg p-3 border">
          <div className="flex items-center gap-2 text-sm">
            <Link2 className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Verknüpft mit:</span>
            <Badge variant="secondary" className="font-medium">
              {responsibility.name}
            </Badge>
          </div>
          {responsibility.responsible_user_name && (
            <p className="text-xs text-muted-foreground mt-1 ml-6">
              Verantwortlich: {responsibility.responsible_user_name}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Aufgabentitel eingeben..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detaillierte Beschreibung..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorität</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Fälligkeitsdatum</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Zugewiesen an</Label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
              {teamMembers && teamMembers.length > 0 ? (
                teamMembers.filter(isActiveMember).map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={assignedUserIds.includes(member.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAssignedUserIds([...assignedUserIds, member.id])
                        } else {
                          setAssignedUserIds(assignedUserIds.filter((id) => id !== member.id))
                        }
                      }}
                    />
                    <label
                      htmlFor={`member-${member.id}`}
                      className="flex items-center space-x-2 cursor-pointer flex-1"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatar || ""} />
                        <AvatarFallback className="text-xs">
                          {member.name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase() || "TM"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.name || member.email || "Unbekannt"}</span>
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Keine Teammitglieder verfügbar</p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.dringend}
                onCheckedChange={(checked) => setFormData({ ...formData, dringend: checked as boolean })}
              />
              <span className="text-sm">Dringend</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.wichtig}
                onCheckedChange={(checked) => setFormData({ ...formData, wichtig: checked as boolean })}
              />
              <span className="text-sm">Wichtig</span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Erstelle..." : "Aufgabe erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

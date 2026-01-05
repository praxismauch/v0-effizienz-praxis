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
import { useTodos } from "@/contexts/todo-context"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import { TodoAttachmentUpload } from "@/components/todo-attachment-upload"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { isActiveMember } from "@/lib/utils/team-member-filter"

interface CreateTodoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CreateTodoDialog({ open, onOpenChange }: CreateTodoDialogProps) {
  const { addTodo } = useTodos()
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>([])
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    due_date: "",
    recurrence_type: "none" as "none" | "daily" | "weekly" | "monthly" | "yearly",
    recurrence_end_date: "",
    dringend: false,
    wichtig: false,
  })

  // Fetch team members when dialog opens
  useEffect(() => {
    if (open && currentPractice?.id) {
      fetch(`/api/practices/${currentPractice.id}/team-members`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          return res.json()
        })
        .then((data) => {
          console.log("[v0] Fetched team members:", data)
          // Data is an array directly, not wrapped in an object
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

    try {
      const todoData = {
        ...formData,
        assigned_user_ids: assignedUserIds.length > 0 ? assignedUserIds : [], // Always send array, even if empty
        completed: false,
        due_date: formData.due_date || null,
        recurrence_end_date: formData.recurrence_end_date || null,
      }

      console.log("[v0] Creating todo with assigned_user_ids:", assignedUserIds)

      await addTodo(todoData)

      if (attachments.length > 0) {
        toast({
          title: "Hinweis",
          description: "Anhänge werden beim nächsten Bearbeiten gespeichert",
        })
      }

      toast({
        title: "Erstellt",
        description: "Neue Aufgabe wurde erstellt",
      })

      // Reset form and close dialog
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
        recurrence_type: "none",
        recurrence_end_date: "",
        dringend: false,
        wichtig: false,
      })
      setAssignedUserIds([])
      setAttachments([])
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error saving todo:", error)
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht gespeichert werden",
        variant: "destructive",
      })
    }
  }

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      due_date: "",
      recurrence_type: "none",
      recurrence_end_date: "",
      dringend: false,
      wichtig: false,
    })
    setAssignedUserIds([])
    setAttachments([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neue Aufgabe</DialogTitle>
          <DialogDescription>Erstellen Sie eine neue Aufgabe</DialogDescription>
        </DialogHeader>

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
                            .map((n) => n[0])
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
            {assignedUserIds.length > 0 && (
              <p className="text-xs text-muted-foreground">{assignedUserIds.length} Teammitglied(er) ausgewählt</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recurrence_type">Wiederholung</Label>
              <Select
                value={formData.recurrence_type}
                onValueChange={(value: any) => setFormData({ ...formData, recurrence_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.recurrence_type !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="recurrence_end_date">Wiederholung endet am</Label>
                <Input
                  id="recurrence_end_date"
                  type="date"
                  value={formData.recurrence_end_date}
                  onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                />
              </div>
            )}
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

          {currentPractice?.id && (
            <TodoAttachmentUpload
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              practiceId={currentPractice.id}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>Erstellen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTodoDialog

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Users, Loader2 } from "lucide-react"

interface Team {
  id: string
  name: string
  color?: string
  memberCount?: number
  isActive?: boolean
}

interface CreateTodoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CreateTodoDialog({ open, onOpenChange }: CreateTodoDialogProps) {
  const { addTodo } = useTodos()
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const router = useRouter()
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([])
  const [assignedTeamIds, setAssignedTeamIds] = useState<string[]>([])

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
          setTeamMembers(Array.isArray(data) ? data : [])
        })
        .catch((err) => {
          console.error("[v0] Error fetching team members:", err)
          setTeamMembers([])
        })

      setLoadingTeams(true)
      fetch(`/api/practices/${currentPractice.id}/teams`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
          return res.json()
        })
        .then((data) => {
          setTeams(Array.isArray(data) ? data.filter((t: Team) => t.isActive !== false) : [])
        })
        .catch((err) => {
          console.error("[v0] Error fetching teams:", err)
          setTeams([])
        })
        .finally(() => setLoadingTeams(false))
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
        assigned_user_ids: assignedUserIds.length > 0 ? assignedUserIds : [],
        assigned_team_ids: assignedTeamIds.length > 0 ? assignedTeamIds : [],
        completed: false,
        due_date: formData.due_date || null,
        recurrence_end_date: formData.recurrence_end_date || null,
      }

      console.log("[v0] Creating todo with assigned_user_ids:", assignedUserIds)
      console.log("[v0] Creating todo with assigned_team_ids:", assignedTeamIds)

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
      setAssignedTeamIds([])
      setAttachments([])
      onOpenChange(false)

      router.push("/todos")
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
    setAssignedTeamIds([])
    setAttachments([])
    onOpenChange(false)
  }

  const toggleTeam = (teamId: string) => {
    if (assignedTeamIds.includes(teamId)) {
      setAssignedTeamIds(assignedTeamIds.filter((id) => id !== teamId))
    } else {
      setAssignedTeamIds([...assignedTeamIds, teamId])
    }
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
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Teams zuweisen
            </Label>
            {loadingTeams ? (
              <div className="flex items-center gap-2 h-16 px-3 border rounded-md bg-muted/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Lade Teams...</span>
              </div>
            ) : teams.length > 0 ? (
              <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                {teams.map((team) => (
                  <div key={team.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`team-${team.id}`}
                      checked={assignedTeamIds.includes(team.id)}
                      onCheckedChange={() => toggleTeam(team.id)}
                    />
                    <label htmlFor={`team-${team.id}`} className="flex items-center space-x-2 cursor-pointer flex-1">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: team.color || "#64748b" }}
                      />
                      <span className="text-sm font-medium">{team.name}</span>
                      {team.memberCount !== undefined && (
                        <span className="text-xs text-muted-foreground">({team.memberCount} Mitglieder)</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground border rounded-md p-3">Keine Teams verfügbar</p>
            )}
            {assignedTeamIds.length > 0 && (
              <p className="text-xs text-muted-foreground">{assignedTeamIds.length} Team(s) ausgewählt</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Zugewiesen an (Einzelpersonen)</Label>
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
            {assignedUserIds.length > 0 && (
              <p className="text-xs text-muted-foreground">{assignedUserIds.length} Teammitglied(er) ausgewählt</p>
            )}
          </div>

          {/* ... existing code for recurrence, dringend, wichtig, attachments ... */}
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

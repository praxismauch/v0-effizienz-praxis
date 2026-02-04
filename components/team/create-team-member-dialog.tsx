"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import Logger from "@/lib/logger"

interface CreateTeamMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teams: Array<{ id: string; name: string; color: string }>
  onSuccess?: () => void
}

export function CreateTeamMemberDialog({ open, onOpenChange, teams, onSuccess }: CreateTeamMemberDialogProps) {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const [isLoading, setIsLoading] = useState(false)
  const [departments, setDepartments] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    role: "user",
    teamIds: [] as string[],
  })

  const getEffectivePracticeId = () => {
    if (!currentPractice?.id || currentPractice.id === "0" || currentPractice.id === "practice-demo-001") {
      return "1"
    }
    return currentPractice.id
  }

  useEffect(() => {
    const fetchDepartments = async () => {
      if (!open) return

      const practiceId = getEffectivePracticeId()

      try {
        const response = await fetch(`/api/practices/${practiceId}/departments`)
        const data = await response.json()
        setDepartments(data.departments || [])
      } catch (error) {
        Logger.warn("component", "Failed to fetch departments", { error })
      }
    }

    fetchDepartments()
  }, [open])

  const handleSubmit = async () => {
    const practiceId = getEffectivePracticeId()

    if (!formData.firstName || !formData.lastName) {
      toast({
        title: "Pflichtfelder fehlen",
        description: "Bitte füllen Sie Vorname und Nachname aus.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/practices/${practiceId}/team-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create team member")
      }

      toast({
        title: "Erfolg",
        description: "Team-Mitglied wurde erfolgreich hinzugefügt",
      })

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        department: "",
        role: "user",
        teamIds: [],
      })

      onOpenChange(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      Logger.error("component", "Failed to create team member", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Team-Mitglied konnte nicht erstellt werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Team-Mitglied hinzufügen</DialogTitle>
          <DialogDescription>Fügen Sie ein neues Team-Mitglied mit allen Details hinzu.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="firstName">Vorname *</Label>
            <Input
              id="firstName"
              placeholder="Max"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Nachname *</Label>
            <Input
              id="lastName"
              placeholder="Mustermann"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="email">E-Mail-Adresse (optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="max.mustermann@beispiel.de"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          {teams && teams.length > 0 && (
            <div>
              <Label>Teams zuweisen (optional)</Label>
              <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                {teams.map((team) => (
                  <div key={team.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`team-${team.id}`}
                      checked={formData.teamIds.includes(team.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, teamIds: [...formData.teamIds, team.id] })
                        } else {
                          setFormData({
                            ...formData,
                            teamIds: formData.teamIds.filter((id) => id !== team.id),
                          })
                        }
                      }}
                    />
                    <Label
                      htmlFor={`team-${team.id}`}
                      className="text-sm font-normal cursor-pointer flex items-center gap-2"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                      {team.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="role">Rolle *</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Rolle wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Standard Nutzer</SelectItem>
                <SelectItem value="poweruser">Powernutzer</SelectItem>
                <SelectItem value="practiceadmin">Praxis Administrator</SelectItem>
                <SelectItem value="superadmin">Super Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="department">Abteilung (optional)</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData({ ...formData, department: value })}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="Abteilung wählen" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                      {dept.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !formData.firstName || !formData.lastName}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mitglied hinzufügen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTeamMemberDialog

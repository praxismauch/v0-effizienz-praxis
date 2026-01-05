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
import { toast } from "@/components/ui/use-toast"

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

  useEffect(() => {
    const fetchDepartments = async () => {
      if (!currentPractice?.id || !open) {
        return
      }

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/departments`)
        const data = await response.json()
        setDepartments(data.departments || [])
      } catch (error) {
        console.error("Failed to fetch departments:", error)
      }
    }

    fetchDepartments()
  }, [currentPractice?.id, open])

  const handleSubmit = async () => {
    const practiceId = currentPractice?.id

    console.log("[v0] CreateTeamMemberDialog - handleSubmit called")
    console.log("[v0] CreateTeamMemberDialog - formData:", formData)
    console.log("[v0] CreateTeamMemberDialog - currentUser:", currentUser)
    console.log("[v0] CreateTeamMemberDialog - practiceId:", practiceId)

    if (!formData.firstName || !formData.lastName) {
      console.log("[v0] CreateTeamMemberDialog - Missing required fields")
      toast({
        title: "Pflichtfelder fehlen",
        description: "Bitte füllen Sie Vorname und Nachname aus.",
        variant: "destructive",
      })
      return
    }

    if (!practiceId || practiceId === "" || practiceId === "practice-demo-001") {
      console.log("[v0] CreateTeamMemberDialog - No valid practice ID:", practiceId)
      toast({
        title: "Keine Praxis zugeordnet",
        description:
          "Sie müssen einer Praxis zugeordnet sein, um Team-Mitglieder hinzuzufügen. Bitte wenden Sie sich an den Administrator.",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] CreateTeamMemberDialog - Starting API call")
    setIsLoading(true)

    try {
      const response = await fetch(`/api/practices/${practiceId}/team-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log("[v0] CreateTeamMemberDialog - API response:", data)

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
      console.error("[v0] CreateTeamMemberDialog - Error:", error)
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

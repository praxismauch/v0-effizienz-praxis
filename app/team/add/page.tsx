"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTeam } from "@/contexts/team-context"
import { usePractice } from "@/contexts/practice-context"
import { toast } from "sonner"
import { ArrowLeft, Loader2 } from "lucide-react"
import { AppLayout } from "@/components/app-layout"

export default function AddTeamMemberPage() {
  const router = useRouter()
  const { teams, refetchTeamMembers, practiceId } = useTeam()
  const { currentPractice } = usePractice()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
    department: "",
    teamIds: [] as string[],
    dateOfBirth: "",
  })

  const effectivePracticeId = practiceId || currentPractice?.id?.toString() || "1"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName.trim()) {
      toast.error("Bitte geben Sie einen Vornamen ein")
      return
    }

    if (!formData.lastName.trim()) {
      toast.error("Bitte geben Sie einen Nachnamen ein")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/practices/${effectivePracticeId}/team-members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim() || undefined,
          role: formData.role,
          department: formData.department.trim() || undefined,
          teamIds: formData.teamIds,
          date_of_birth: formData.dateOfBirth || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Erstellen des Teammitglieds")
      }

      toast.success("Teammitglied erfolgreich hinzugefügt")
      await refetchTeamMembers()
      router.push("/team")
    } catch (error) {
      console.error("Error adding team member:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Erstellen des Teammitglieds")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTeamToggle = (teamId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      teamIds: checked
        ? [...prev.teamIds, teamId]
        : prev.teamIds.filter((id) => id !== teamId),
    }))
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/team")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Team
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold">Neues Teammitglied hinzufügen</h1>
          <p className="text-muted-foreground">
            Fügen Sie ein neues Mitglied zu Ihrem Team hinzu
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Persönliche Informationen</CardTitle>
              <CardDescription>Grundlegende Informationen über das Teammitglied</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Max"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Mustermann"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail-Adresse</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="max.mustermann@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Das Teammitglied kann sich mit dieser E-Mail-Adresse anmelden.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Geburtsdatum</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Abteilung</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                  placeholder="z.B. Empfang, Labor, etc."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rolle & Berechtigungen</CardTitle>
              <CardDescription>Legen Sie die Rolle des Teammitglieds fest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Rolle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rolle auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Benutzer</SelectItem>
                    <SelectItem value="poweruser">Power User</SelectItem>
                    <SelectItem value="admin">Praxis Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Benutzer haben eingeschränkten Zugriff. Power User können mehr Funktionen nutzen. Admins haben vollen Zugriff.
                </p>
              </div>
            </CardContent>
          </Card>

          {teams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Teamzuweisung</CardTitle>
                <CardDescription>Weisen Sie das Mitglied einem oder mehreren Teams zu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`team-${team.id}`}
                        checked={formData.teamIds.includes(team.id)}
                        onCheckedChange={(checked) => handleTeamToggle(team.id, checked === true)}
                      />
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: team.color || "#3b82f6" }}
                        />
                        <Label htmlFor={`team-${team.id}`} className="cursor-pointer">
                          {team.name}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/team")}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Teammitglied hinzufügen
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

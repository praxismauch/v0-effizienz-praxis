"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileImageEditor } from "@/components/profile-image-editor"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTeam } from "@/contexts/team-context"
import { useUser, type User } from "@/contexts/user-context"
import { Shield, UserIcon, Settings, Camera, Star } from "lucide-react"
import { useRoleColors } from "@/lib/use-role-colors"
import { FavoritesManager } from "@/components/favorites-manager"
import { getRoleLabel } from "@/lib/roles"

interface TeamMember extends User {
  permissions: string[]
  lastActive: string
  teamIds: string[]
}

interface EditProfileDialogProps {
  member: TeamMember
  open: boolean
  onOpenChange: (open: boolean) => void
}

const availablePermissions = [
  { id: "all", label: "Alle Berechtigungen", description: "Voller Zugriff auf alle Systemfunktionen" },
  // Übersicht
  { id: "dashboard", label: "Dashboard", description: "Übersichtsseite und Statistiken anzeigen" },
  { id: "analytics", label: "Analysen", description: "Praxisanalysen und Auswertungen einsehen" },
  // Praxismanagement
  { id: "leitbild", label: "Leitbild", description: "Praxisleitbild und Vision verwalten" },
  { id: "wunschpatient", label: "Wunschpatient", description: "Wunschpatienten-Profile erstellen und bearbeiten" },
  { id: "profile", label: "Praxisprofil", description: "Praxisprofil und Informationen bearbeiten" },
  // Team & Personal
  { id: "team", label: "Teamverwaltung", description: "Teammitglieder und Zuweisungen verwalten" },
  { id: "hiring", label: "Recruiting", description: "Stellenausschreibungen und Bewerber verwalten" },
  { id: "training", label: "Fortbildungen", description: "Fortbildungen und Schulungen verwalten" },
  { id: "skills", label: "Kompetenzen", description: "Mitarbeiterkompetenzen und Fähigkeiten pflegen" },
  { id: "responsibilities", label: "Zuständigkeiten", description: "Verantwortungsbereiche definieren" },
  // Planung & Organisation
  { id: "calendar", label: "Kalenderverwaltung", description: "Praxiskalender und Termine verwalten" },
  { id: "tasks", label: "Aufgaben", description: "Aufgaben erstellen und verwalten" },
  { id: "goals", label: "Ziele", description: "Praxis- und Teamziele definieren" },
  { id: "workflows", label: "Workflows", description: "Arbeitsabläufe und Prozesse verwalten" },
  // Daten & Dokumente
  { id: "documents", label: "Dokumente", description: "Dokumente hochladen und verwalten" },
  { id: "knowledge", label: "Wissensdatenbank", description: "Wissensdatenbank pflegen und nutzen" },
  { id: "contacts", label: "Kontakte", description: "Geschäftskontakte und Partner verwalten" },
  // Infrastruktur
  { id: "rooms", label: "Räume", description: "Praxisräume verwalten" },
  { id: "workplaces", label: "Arbeitsplätze", description: "Arbeitsplätze konfigurieren" },
  { id: "equipment", label: "Ausstattung", description: "Geräte und Ausstattung verwalten" },
  // Finanzen & Abrechnung
  { id: "billing", label: "Abrechnung", description: "Abrechnungs- und Finanzunterlagen verwalten" },
  { id: "reports", label: "Berichte", description: "Praxisberichte generieren und einsehen" },
  // Administration
  { id: "settings", label: "Einstellungen", description: "Praxiseinstellungen konfigurieren" },
  { id: "security", label: "Sicherheit", description: "Sicherheitseinstellungen und Benutzerrechte" },
]

function EditProfileDialog({ member, open, onOpenChange }: EditProfileDialogProps) {
  const { updateTeamMember, teams, assignMemberToTeam, removeMemberFromTeam } = useTeam()
  const { currentUser, isAdmin } = useUser()
  const { roleColors } = useRoleColors()

  // Check if current user can edit this profile
  const canEditProfile = isAdmin || currentUser?.id === member.id
  const canEditRole = isAdmin && member.role !== "admin"
  const canEditPermissions = isAdmin
  const canEditTeams = isAdmin

  const [formData, setFormData] = useState({
    name: member.name,
    email: member.email,
    role: member.role,
    permissions: member.permissions,
    teamIds: member.teamIds,
    avatar: member.avatar || "",
  })

  const [activeTab, setActiveTab] = useState("profile")
  const [favorites, setFavorites] = useState<string[]>([])
  const [favoritesLoaded, setFavoritesLoaded] = useState(false)

  // Load favorites when dialog opens
  useEffect(() => {
    const loadFavorites = async () => {
      if (!open || favoritesLoaded) return
      try {
        const response = await fetch(`/api/users/${member.id}/favorites`)
        if (response.ok) {
          const data = await response.json()
          setFavorites(data.favorites || [])
        }
      } catch (error) {
        console.error("[v0] Error loading favorites:", error)
      } finally {
        setFavoritesLoaded(true)
      }
    }
    loadFavorites()
  }, [open, member.id, favoritesLoaded])

  // Reset favoritesLoaded when dialog closes
  useEffect(() => {
    if (!open) {
      setFavoritesLoaded(false)
    }
  }, [open])

  const handleSave = () => {
    try {
      updateTeamMember(member.id, {
        name: formData.name,
        email: formData.email,
        role: canEditRole ? formData.role : member.role,
        permissions: canEditPermissions ? formData.permissions : member.permissions,
        avatar: formData.avatar,
      })

      // Handle team assignments
      if (canEditTeams) {
        const currentTeamIds = member.teamIds
        const newTeamIds = formData.teamIds

        // Remove from teams no longer assigned
        currentTeamIds.forEach((teamId) => {
          if (!newTeamIds.includes(teamId)) {
            removeMemberFromTeam(member.id, teamId)
          }
        })

        // Add to new teams
        newTeamIds.forEach((teamId) => {
          if (!currentTeamIds.includes(teamId)) {
            assignMemberToTeam(member.id, teamId)
          }
        })
      }

      console.log("[v0] Team member profile updated successfully:", formData.name)
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error updating team member profile:", error)
      alert("Failed to update profile. Please try again.")
    }
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (!canEditPermissions) return

    let newPermissions = [...formData.permissions]

    if (permissionId === "all") {
      newPermissions = checked ? ["all"] : []
    } else {
      if (checked) {
        newPermissions = newPermissions.filter((p) => p !== "all")
        if (!newPermissions.includes(permissionId)) {
          newPermissions.push(permissionId)
        }
      } else {
        newPermissions = newPermissions.filter((p) => p !== permissionId)
      }
    }

    setFormData((prev) => ({ ...prev, permissions: newPermissions }))
  }

  const handleTeamChange = (teamId: string, checked: boolean) => {
    if (!canEditTeams) return

    let newTeamIds = [...formData.teamIds]

    if (checked) {
      if (!newTeamIds.includes(teamId)) {
        newTeamIds.push(teamId)
      }
    } else {
      newTeamIds = newTeamIds.filter((id) => id !== teamId)
    }

    setFormData((prev) => ({ ...prev, teamIds: newTeamIds }))
  }

  if (!canEditProfile) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {isAdmin || currentUser?.id !== member.id
              ? `Profil von ${member.name} bearbeiten`
              : "Ihr Profil bearbeiten"}
          </DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "Informationen, Berechtigungen und Teamzuweisungen des Teammitglieds aktualisieren."
              : "Ihre persönlichen Informationen und Profildetails aktualisieren."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${2 + (canEditRole ? 1 : 0) + (canEditPermissions ? 1 : 0) + (canEditTeams ? 1 : 0)}, minmax(0, 1fr))` }}>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="favorites">
              <Star className="h-4 w-4 mr-1" />
              Favoriten
            </TabsTrigger>
            {canEditRole && <TabsTrigger value="role">Rolle</TabsTrigger>}
            {canEditPermissions && <TabsTrigger value="permissions">Berechtigungen</TabsTrigger>}
            {canEditTeams && <TabsTrigger value="teams">Teams</TabsTrigger>}
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Persönliche Informationen</CardTitle>
                <CardDescription>Grundlegende Profilinformationen und Kontaktdaten</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={formData.avatar || "/placeholder.svg"}
                      alt={formData.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-lg">
                      {formData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Label>Profilbild</Label>
                    <div className="flex gap-2 mt-1">
                      <ProfileImageEditor
                        currentAvatar={formData.avatar}
                        userName={formData.name}
                        onAvatarChange={(avatarUrl) => setFormData((prev) => ({ ...prev, avatar: avatarUrl }))}
                        trigger={
                          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                            <Camera className="h-4 w-4" />
                            Bild ändern
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Vollständiger Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-Mail-Adresse</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={roleColors[member.role]}>{getRoleLabel(member.role)}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Mitglied seit {new Date(member.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            <FavoritesManager 
              favorites={favorites} 
              onFavoritesChange={setFavorites}
            />
          </TabsContent>

          {canEditRole && (
            <TabsContent value="role" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Rolle & Zugriffsebene
                  </CardTitle>
                  <CardDescription>Rolle und grundlegende Zugriffsebene des Mitglieds ändern</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="role">Rolle</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: any) => setFormData((prev) => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doctor">Arzt</SelectItem>
                        <SelectItem value="nurse">MFA/Pflege</SelectItem>
                        <SelectItem value="receptionist">Empfang</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Rollenbeschreibungen</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className={roleColors.doctor}>Arzt</Badge>
                        <span className="text-muted-foreground">
                          Voller medizinischer Zugriff, kann Patientenakten und Behandlungen verwalten
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={roleColors.nurse}>MFA/Pflege</Badge>
                        <span className="text-muted-foreground">
                          Zugriff auf Patientenversorgung, kann Akten aktualisieren und bei Behandlungen assistieren
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={roleColors.receptionist}>Empfang</Badge>
                        <span className="text-muted-foreground">
                          Administrativer Zugriff, kann Terminplanung und Abrechnung verwalten
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {canEditPermissions && (
            <TabsContent value="permissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Berechtigungen
                  </CardTitle>
                  <CardDescription>Spezifische Berechtigungen für dieses Teammitglied anpassen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availablePermissions.map((permission) => {
                    const isChecked =
                      formData.permissions.includes(permission.id) || formData.permissions.includes("all")
                    const isDisabled = formData.permissions.includes("all") && permission.id !== "all"

                    return (
                      <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={permission.id}
                          checked={isChecked}
                          disabled={isDisabled}
                          onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={permission.id} className="font-medium">
                            {permission.label}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">{permission.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {canEditTeams && (
            <TabsContent value="teams" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Teamzuweisungen</CardTitle>
                  <CardDescription>Dieses Mitglied Teams zuweisen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {teams.map((team) => {
                    const isAssigned = formData.teamIds.includes(team.id)

                    return (
                      <div key={team.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={team.id}
                          checked={isAssigned}
                          onCheckedChange={(checked) => handleTeamChange(team.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={team.color}>{team.name}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {teams.find((t) => t.id === team.id)?.memberCount || 0} Mitglieder
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{team.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>Änderungen speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditProfileDialog

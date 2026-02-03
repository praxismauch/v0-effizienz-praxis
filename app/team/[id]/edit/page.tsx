"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ProfileImageEditor from "@/components/profile-image-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTeam } from "@/contexts/team-context"
import { useUser } from "@/contexts/user-context"
import { useTranslation } from "@/contexts/translation-context"
import { toast } from "sonner"
import { useRoleColors } from "@/lib/use-role-colors"
import { ContractsManager } from "@/components/team/contracts-manager"
import { TeamMemberVaccinationTab } from "@/components/team/team-member-vaccination-tab"
import { TeamMemberDocumentsTab } from "@/components/team/team-member-documents-tab"
import { ArrowLeft, Clipboard, Trash2, Syringe, FileText, Cake, Package } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import AppLayout from "@/components/app-layout" // Import AppLayout
import ArbeitsmittelAssignments from "@/components/team/arbeitsmittel-assignments" // Import ArbeitsmittelAssignments
import { format } from "date-fns" // Import format
import { de } from "date-fns/locale" // Import de

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

const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d)
}

export default function EditTeamMemberPage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string
  const { t } = useTranslation()
  const { roleColors } = useRoleColors()

  const {
    teamMembers,
    updateTeamMember,
    teams,
    assignMemberToTeam,
    removeMemberFromTeam,
    practiceId,
    removeTeamMember,
  } = useTeam()
  const { currentUser, isAdmin, isSuperAdmin } = useUser()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
    permissions: [] as string[],
    teamIds: [] as string[],
    avatar: "",
    status: "active",
    dateOfBirth: "",
  })

  const [activeTab, setActiveTab] = useState("profile")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const member = teamMembers.find((m) => m.id === memberId)

  const canEditProfile = isAdmin || currentUser?.id === memberId
  const canEditRole = isAdmin && member?.role !== "admin"
  const canEditPermissions = isAdmin
  const canEditTeams = isAdmin
  const canEditStatus = isAdmin
  const canDeleteMember = (isAdmin || isSuperAdmin) && currentUser?.id !== memberId

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pasteInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (member) {
      // Use first_name/last_name directly if available, otherwise split from name
      let firstName = member.first_name || ""
      let lastName = member.last_name || ""
      
      // Fallback: if first_name/last_name not available, try to split from name
      if (!firstName && !lastName && member.name) {
        const nameParts = member.name.split(" ")
        firstName = nameParts[0] || ""
        lastName = nameParts.slice(1).join(" ") || ""
      }

      setFormData({
        firstName,
        lastName,
        email: member.email || "",
        role: member.role || "user",
        permissions: member.permissions || [],
        teamIds: member.teamIds || [],
        avatar: member.avatar || "",
        status: member.isActive ? "active" : "inactive",
        dateOfBirth: member.date_of_birth || member.dateOfBirth || "",
      })
    }
  }, [member])

  const handleSave = async () => {
    setIsUpdatingStatus(true)
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim()

      updateTeamMember(memberId, {
        name: fullName,
        email: formData.email,
        role: canEditRole ? formData.role : member.role,
        permissions: canEditPermissions ? formData.permissions : member.permissions,
        avatar: formData.avatar,
        isActive: formData.status === "active",
        date_of_birth: formData.dateOfBirth || null,
      })

      // Handle team assignments
      if (canEditTeams) {
        const currentTeamIds = member.teamIds
        const newTeamIds = formData.teamIds

        // Remove from teams no longer assigned
        currentTeamIds.forEach((teamId) => {
          if (!newTeamIds.includes(teamId)) {
            removeMemberFromTeam(memberId, teamId)
          }
        })

        // Add to new teams
        newTeamIds.forEach((teamId) => {
          if (!currentTeamIds.includes(teamId)) {
            assignMemberToTeam(memberId, teamId)
          }
        })
      }

      toast.success("Änderungen gespeichert", {
        description: "Die Änderungen wurden erfolgreich gespeichert.",
      })
      router.push(`/team/${memberId}`)
    } catch (error) {
      console.error("Error updating team member profile:", error)
      toast.error("Fehler", {
        description:
          error instanceof Error
            ? error.message
            : "Die Änderungen konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.",
      })
    } finally {
      setIsUpdatingStatus(false)
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

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true)
    try {
      const response = await fetch(`/api/team-members/${memberId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: newStatus === "active",
        }),
      })

      if (!response.ok) {
        throw new Error("Status konnte nicht aktualisiert werden")
      }

      toast.success("Status aktualisiert", {
        description: `Der Status wurde erfolgreich auf "${newStatus === "active" ? "Aktiv" : "Inaktiv"}" gesetzt.`,
      })

      router.refresh()
    } catch (error) {
      toast.error("Fehler", {
        description: error instanceof Error ? error.message : "Status konnte nicht aktualisiert werden",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const calculateAge = (dateOfBirth: string | null): number | null => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handlePasteImage = async () => {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.read) {
        // Fallback: focus hidden input and show toast
        if (pasteInputRef.current) {
          pasteInputRef.current.style.pointerEvents = "auto"
          pasteInputRef.current.focus()
          setTimeout(() => {
            if (pasteInputRef.current) {
              pasteInputRef.current.style.pointerEvents = "none"
            }
          }, 100)
        }
        toast.info("Drücken Sie Strg+V (oder Cmd+V) um ein Bild einzufügen")
        return
      }

      // Try to read from clipboard directly
      const clipboardItems = await navigator.clipboard.read()

      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith("image/"))
        if (imageType) {
          const blob = await item.getType(imageType)
          const file = new File([blob], "pasted-image.png", { type: imageType })

          // Upload to blob storage
          const formDataUpload = new FormData()
          formDataUpload.append("file", file)
          formDataUpload.append("type", "avatar")

          const response = await fetch("/api/upload/unified", {
            method: "POST",
            body: formDataUpload,
          })

          if (!response.ok) {
            throw new Error("Upload fehlgeschlagen")
          }

          const { url } = await response.json()
          setFormData((prev) => ({ ...prev, avatar: url }))
          toast.success("Bild aus Zwischenablage eingefügt")
          return
        }
      }

      toast.error("Kein Bild in der Zwischenablage gefunden")
    } catch (error) {
      // If clipboard API fails due to permissions, fall back to hidden input
      if (pasteInputRef.current) {
        pasteInputRef.current.style.pointerEvents = "auto"
        pasteInputRef.current.focus()
        setTimeout(() => {
          if (pasteInputRef.current) {
            pasteInputRef.current.style.pointerEvents = "none"
          }
        }, 100)
      }
      toast.info("Drücken Sie Strg+V (oder Cmd+V) um ein Bild einzufügen")
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const blob = items[i].getAsFile()
        if (blob) {
          const file = new File([blob], "pasted-image.png", { type: items[i].type })

          // Upload to blob storage
          const formDataUpload = new FormData()
          formDataUpload.append("file", file)
          formDataUpload.append("type", "avatar")

          try {
            const response = await fetch("/api/upload/unified", {
              method: "POST",
              body: formDataUpload,
            })

            if (!response.ok) {
              throw new Error("Upload fehlgeschlagen")
            }

            const { url } = await response.json()
            setFormData((prev) => ({ ...prev, avatar: url }))
            toast.success("Bild aus Zwischenablage eingefügt")
          } catch (error) {
            console.error("Upload error:", error)
            toast.error("Fehler beim Hochladen des Bildes")
          }
          return
        }
      }
    }
    toast.error("Kein Bild in der Zwischenablage gefunden")
  }

  const handleDeleteMember = async () => {
    if (!member) return

    const effectivePracticeId = practiceId || "1"

    setIsDeleting(true)
    try {
      console.log("[v0] Deleting team member:", { practiceId: effectivePracticeId, memberId, member })

      const response = await fetch(`/api/practices/${effectivePracticeId}/team-members/${memberId}`, {
        method: "DELETE",
      })

      const responseData = await response.json()
      console.log("[v0] Delete response:", { ok: response.ok, status: response.status, data: responseData })

      if (!response.ok) {
        throw new Error(responseData.error || "Fehler beim Löschen")
      }

      removeTeamMember(memberId)

      toast.success(`${member.name || `${formData.firstName} ${formData.lastName}`} wurde deaktiviert`)
      router.push("/team")
    } catch (error) {
      console.error("[v0] Error deleting team member:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Löschen des Teammitglieds")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/team")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Team
            {formData.firstName || formData.lastName ? (
              <span className="ml-2 text-muted-foreground">
                • {formData.firstName} {formData.lastName}
              </span>
            ) : null}
          </Button>
          <div className="flex gap-2">
            {canDeleteMember && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? "Wird gelöscht..." : "Mitglied löschen"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Teammitglied löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Sind Sie sicher, dass Sie{" "}
                      <span className="font-semibold">
                        {formData.firstName} {formData.lastName}
                      </span>{" "}
                      löschen möchten? Das Mitglied wird deaktiviert und kann sich nicht mehr anmelden. Diese Aktion
                      kann rückgängig gemacht werden, indem der Status wieder auf "Aktiv" gesetzt wird.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault()
                        handleDeleteMember()
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Wird gelöscht..." : "Löschen"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="outline" onClick={() => router.push("/team")}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>Änderungen speichern</Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto gap-1">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            {canEditPermissions && <TabsTrigger value="permissions">Berechtigungen</TabsTrigger>}
            <TabsTrigger value="contracts">Verträge</TabsTrigger>
            <TabsTrigger value="documents" className="gap-1">
              <FileText className="h-3 w-3" />
              Dokumente
            </TabsTrigger>
            <TabsTrigger value="arbeitsmittel">Arbeitsmittel</TabsTrigger>
            <TabsTrigger value="vaccinations" className="gap-1">
              <Syringe className="h-3 w-3" />
              Impfstatus
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Persönliche Informationen</CardTitle>
                <CardDescription>Grundlegende Informationen über das Teammitglied</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-24 w-24">
                    {formData.avatar && (
                      <AvatarImage
                        src={formData.avatar || "/placeholder.svg"}
                        alt={`${formData.firstName} ${formData.lastName}`}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="text-3xl font-semibold bg-primary/10 text-primary">
                      {formData.firstName?.[0]?.toUpperCase() || ""}
                      {formData.lastName?.[0]?.toUpperCase() || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Label>Profilbild</Label>
                    <div className="flex gap-2 mt-1">
                      <ProfileImageEditor
                        currentAvatar={formData.avatar}
                        userName={`${formData.firstName} ${formData.lastName}`}
                        onAvatarChange={(avatarUrl) => setFormData((prev) => ({ ...prev, avatar: avatarUrl }))}
                        trigger={
                          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                            {/* Camera icon here */}
                            Bild ändern
                          </Button>
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent"
                        onClick={handlePasteImage}
                      >
                        <Clipboard className="h-4 w-4" />
                        Einfügen
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Vorname</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Vorname eingeben"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nachname</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Nachname eingeben"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">E-Mail-Adresse</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder={formData.email.includes("@placeholder.local") ? "Keine E-Mail-Adresse" : ""}
                      className={formData.email.includes("@placeholder.local") ? "text-muted-foreground" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                      <Cake className="h-4 w-4" />
                      Geburtsdatum
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <Label>Mitglied seit</Label>
                    <div className="p-2 border rounded-md bg-muted/50">
                      {member?.created_at
                        ? format(new Date(member.created_at), "dd. MMMM yyyy", { locale: de })
                        : "Nicht verfügbar"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Aktiv
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-400" />
                            Inaktiv
                          </div>
                        </SelectItem>
                        <SelectItem value="on_leave">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            Beurlaubt
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team</CardTitle>
                <CardDescription>Dieses Mitglied einem Team zuweisen</CardDescription>
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

            {canEditRole && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">Rolle & Zugriffsebene</CardTitle>
                  <CardDescription>Rolle und grundlegende Zugriffsebene des Mitglieds ändern</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="role">Rolle</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                      disabled={!canEditRole}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Rolle auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Benutzer</SelectItem>
                        <SelectItem value="poweruser">Power User</SelectItem>
                        <SelectItem value="admin">Praxis Admin</SelectItem>
                        <SelectItem value="practiceadmin">Praxis Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {canEditPermissions && (
            <TabsContent value="permissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">Berechtigungen</CardTitle>
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

          <TabsContent value="contracts" className="space-y-4">
            {member ? (
              <ContractsManager 
                memberId={memberId} 
                memberName={member.name}
                practiceId={member.practice_id || ""}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Mitarbeiterdaten werden geladen...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="arbeitsmittel" className="space-y-4">
            {member ? (
              <ArbeitsmittelAssignments
                teamMemberId={memberId}
                practiceId={member.practice_id || ""}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Mitarbeiterdaten werden geladen...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="vaccinations" className="space-y-4">
            {member ? (
              <TeamMemberVaccinationTab
                teamMemberId={memberId}
                practiceId={Number(member.practice_id) || 1}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Syringe className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Mitarbeiterdaten werden geladen...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {member ? (
              <TeamMemberDocumentsTab
                teamMemberId={memberId}
                practiceId={member.practice_id || "1"}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Mitarbeiterdaten werden geladen...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <input ref={pasteInputRef} type="text" className="sr-only" onPaste={handlePaste} aria-hidden="true" />
    </AppLayout>
  )
}

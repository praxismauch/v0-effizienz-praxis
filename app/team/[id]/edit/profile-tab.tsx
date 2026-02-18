"use client"

import type React from "react"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ProfileImageEditor from "@/components/profile-image-editor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clipboard, Cake } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import type { TeamEditFormData } from "./constants"

interface ProfileTabProps {
  formData: TeamEditFormData
  setFormData: React.Dispatch<React.SetStateAction<TeamEditFormData>>
  member: any
  teams: any[]
  canEditRole: boolean
  canEditTeams: boolean
  onTeamChange: (teamId: string, checked: boolean) => void
}

export function ProfileTab({
  formData,
  setFormData,
  member,
  teams,
  canEditRole,
  canEditTeams,
  onTeamChange,
}: ProfileTabProps) {
  const pasteInputRef = useRef<HTMLInputElement>(null)

  const handlePasteImage = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        if (pasteInputRef.current) {
          pasteInputRef.current.style.pointerEvents = "auto"
          pasteInputRef.current.focus()
          setTimeout(() => {
            if (pasteInputRef.current) pasteInputRef.current.style.pointerEvents = "none"
          }, 100)
        }
        toast.info("Drucken Sie Strg+V (oder Cmd+V) um ein Bild einzufugen")
        return
      }

      const clipboardItems = await navigator.clipboard.read()
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith("image/"))
        if (imageType) {
          const blob = await item.getType(imageType)
          const file = new File([blob], "pasted-image.png", { type: imageType })
          const formDataUpload = new FormData()
          formDataUpload.append("file", file)
          formDataUpload.append("type", "avatar")

          const response = await fetch("/api/upload/unified", { method: "POST", body: formDataUpload })
          if (!response.ok) throw new Error("Upload fehlgeschlagen")

          const { url } = await response.json()
          setFormData((prev) => ({ ...prev, avatar: url }))
          toast.success("Bild aus Zwischenablage eingefugt")
          return
        }
      }
      toast.error("Kein Bild in der Zwischenablage gefunden")
    } catch {
      if (pasteInputRef.current) {
        pasteInputRef.current.style.pointerEvents = "auto"
        pasteInputRef.current.focus()
        setTimeout(() => {
          if (pasteInputRef.current) pasteInputRef.current.style.pointerEvents = "none"
        }, 100)
      }
      toast.info("Drucken Sie Strg+V (oder Cmd+V) um ein Bild einzufugen")
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
          const formDataUpload = new FormData()
          formDataUpload.append("file", file)
          formDataUpload.append("type", "avatar")

          try {
            const response = await fetch("/api/upload/unified", { method: "POST", body: formDataUpload })
            if (!response.ok) throw new Error("Upload fehlgeschlagen")
            const { url } = await response.json()
            setFormData((prev) => ({ ...prev, avatar: url }))
            toast.success("Bild aus Zwischenablage eingefugt")
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

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personliche Informationen</CardTitle>
            <CardDescription>Grundlegende Informationen uber das Teammitglied</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-24 w-24">
                {formData.avatar && (
                  <AvatarImage
                    src={formData.avatar || "/placeholder.svg"}
                    alt={`${formData.firstName} ${formData.lastName}`}
                    className="object-contain"
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
                        Bild andern
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
                    Einfugen
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
            {teams.map((team) => (
              <div key={team.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={team.id}
                  checked={formData.teamIds.includes(team.id)}
                  onCheckedChange={(checked) => onTeamChange(team.id, checked as boolean)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={team.color}>{team.name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {team.memberCount || 0} Mitglieder
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{team.description}</p>
                </div>
              </div>
            ))}
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
      </div>
      <input ref={pasteInputRef} type="text" className="sr-only" onPaste={handlePaste} aria-hidden="true" />
    </>
  )
}

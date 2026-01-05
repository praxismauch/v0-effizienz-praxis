"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { useTranslation } from "@/contexts/translation-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserIcon, Users, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { isActiveMember } from "@/lib/utils/team-member-filter"

interface Permission {
  id: string
  user_id: string | null
  team_id: string | null
  permission_level: "view" | "edit" | "admin"
  user?: { id: string; name: string; email: string }
  team?: { id: string; name: string }
}

interface Team {
  id: string
  name: string
}

interface DocumentPermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId?: string
  folderId?: string
}

export function DocumentPermissionsDialog({
  open,
  onOpenChange,
  documentId,
  folderId,
}: DocumentPermissionsDialogProps) {
  const { currentPractice, currentUser } = useUser()
  const { t } = useTranslation()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [users, setUsers] = useState<
    { id: string; name: string; email: string; isActive?: boolean; status?: string }[]
  >([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedType, setSelectedType] = useState<"user" | "team">("user")
  const [selectedId, setSelectedId] = useState<string>("")
  const [permissionLevel, setPermissionLevel] = useState<"view" | "edit" | "admin">("view")

  useEffect(() => {
    if (open && currentPractice?.id) {
      fetchPermissions()
      fetchUsers()
      fetchTeams()
    }
  }, [open, currentPractice?.id, documentId, folderId])

  const fetchPermissions = async () => {
    try {
      const params = new URLSearchParams()
      if (documentId) params.append("documentId", documentId)
      if (folderId) params.append("folderId", folderId)

      const response = await fetch(`/api/practices/${currentPractice!.id}/document-permissions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPermissions(data)
      }
    } catch (error) {
      console.error("Error fetching permissions:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/practices/${currentPractice!.id}/users`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch(`/api/practices/${currentPractice!.id}/teams`)
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  }

  const handleAddPermission = async () => {
    if (!selectedId || !currentUser?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice!.id}/document-permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: documentId,
          folder_id: folderId,
          user_id: selectedType === "user" ? selectedId : null,
          team_id: selectedType === "team" ? selectedId : null,
          permission_level: permissionLevel,
          granted_by: currentUser.id,
        }),
      })

      if (response.ok) {
        toast.success(t("documents.permissions.added", "Berechtigung hinzugefügt"))
        setSelectedId("")
        fetchPermissions()
      }
    } catch (error) {
      console.error("Error adding permission:", error)
      toast.error(t("documents.permissions.error", "Fehler beim Hinzufügen der Berechtigung"))
    }
  }

  const handleRemovePermission = async (permissionId: string) => {
    try {
      const response = await fetch(
        `/api/practices/${currentPractice!.id}/document-permissions?permissionId=${permissionId}`,
        { method: "DELETE" },
      )

      if (response.ok) {
        toast.success(t("documents.permissions.removed", "Berechtigung entfernt"))
        fetchPermissions()
      }
    } catch (error) {
      console.error("Error removing permission:", error)
      toast.error(t("documents.permissions.removeError", "Fehler beim Entfernen der Berechtigung"))
    }
  }

  const getPermissionBadgeColor = (level: string) => {
    switch (level) {
      case "admin":
        return "destructive"
      case "edit":
        return "default"
      case "view":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("documents.permissions.title", "Berechtigungen verwalten")}</DialogTitle>
          <DialogDescription>
            {t("documents.permissions.description", "Verwalten Sie, wer auf dieses Dokument zugreifen kann")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Permission */}
          <div className="space-y-3 rounded-lg border p-4">
            <h4 className="font-medium">{t("documents.permissions.add", "Berechtigung hinzufügen")}</h4>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t("documents.permissions.type", "Typ")}</Label>
                  <Select value={selectedType} onValueChange={(value: "user" | "team") => setSelectedType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          {t("documents.permissions.user", "Benutzer")}
                        </div>
                      </SelectItem>
                      <SelectItem value="team">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {t("documents.permissions.team", "Team")}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("documents.permissions.level", "Berechtigungsstufe")}</Label>
                  <Select
                    value={permissionLevel}
                    onValueChange={(value: "view" | "edit" | "admin") => setPermissionLevel(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">{t("documents.permissions.view", "Ansehen")}</SelectItem>
                      <SelectItem value="edit">{t("documents.permissions.edit", "Bearbeiten")}</SelectItem>
                      <SelectItem value="admin">{t("documents.permissions.admin", "Administrator")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>
                  {selectedType === "user"
                    ? t("documents.permissions.selectUser", "Benutzer auswählen")
                    : t("documents.permissions.selectTeam", "Team auswählen")}
                </Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("documents.permissions.select", "Auswählen...")} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedType === "user"
                      ? users.filter(isActiveMember).map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))
                      : teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddPermission} disabled={!selectedId} className="w-full">
                {t("documents.permissions.add", "Berechtigung hinzufügen")}
              </Button>
            </div>
          </div>

          {/* Current Permissions */}
          <div className="space-y-3">
            <h4 className="font-medium">{t("documents.permissions.current", "Aktuelle Berechtigungen")}</h4>
            <ScrollArea className="h-[300px] rounded-lg border">
              <div className="space-y-2 p-4">
                {permissions.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    {t("documents.permissions.none", "Keine Berechtigungen festgelegt")}
                  </p>
                ) : (
                  permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        {permission.user_id ? (
                          <>
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{permission.user?.name}</p>
                              <p className="text-xs text-muted-foreground">{permission.user?.email}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{permission.team?.name}</p>
                              <p className="text-xs text-muted-foreground">{t("documents.permissions.team", "Team")}</p>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPermissionBadgeColor(permission.permission_level)}>
                          {t(`documents.permissions.${permission.permission_level}`, permission.permission_level)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePermission(permission.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close", "Schließen")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DocumentPermissionsDialog

"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  Plus,
  Edit,
  Trash,
  Save,
  AlertCircle,
  RefreshCw,
  Shield,
  Users,
  Settings,
  FileText,
  Building,
  DollarSign,
  BarChart,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { ROLE_CONFIG, AVAILABLE_ROLES, type NormalizedRoleKey, type RolePermission } from "@/lib/roles"
import React from "react"

const categoryIcons: Record<string, React.ReactNode> = {
  Übersicht: <BarChart className="h-4 w-4" />,
  Praxismanagement: <Building className="h-4 w-4" />,
  "Team & Personal": <Users className="h-4 w-4" />,
  "Planung & Organisation": <FileText className="h-4 w-4" />,
  "Daten & Dokumente": <FileText className="h-4 w-4" />,
  Infrastruktur: <Settings className="h-4 w-4" />,
  "Finanzen & Abrechnung": <DollarSign className="h-4 w-4" />,
  Administration: <Shield className="h-4 w-4" />,
}

const roles: NormalizedRoleKey[] = ["superadmin", "practiceadmin", "admin", "manager", "member", "viewer", "extern"]

const roleLabels: Record<NormalizedRoleKey, string> = Object.fromEntries(
  Object.entries(ROLE_CONFIG).map(([key, config]) => [key, config.label]),
) as Record<NormalizedRoleKey, string>

const roleColors: Record<NormalizedRoleKey, string> = Object.fromEntries(
  Object.entries(ROLE_CONFIG).map(([key, config]) => [key, config.badgeColor]),
) as Record<NormalizedRoleKey, string>

export function UserRightsManager() {
  const [permissions, setPermissions] = useState<RolePermission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [modifiedPermissions, setModifiedPermissions] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const { toast } = useToast()

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/role-permissions", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch permissions`)
      }

      const data = await response.json()
      setPermissions(data.permissions || [])
    } catch (err) {
      console.error("Error loading permissions:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch permissions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  const handlePermissionChange = (
    id: string,
    field: "can_view" | "can_create" | "can_edit" | "can_delete",
    value: boolean,
  ) => {
    setPermissions((prev) =>
      prev.map((perm) => {
        if (perm.id === id) {
          const updates: Partial<RolePermission> = { [field]: value }
          if (field === "can_view" && !value) {
            updates.can_create = false
            updates.can_edit = false
            updates.can_delete = false
          }
          if ((field === "can_create" || field === "can_edit" || field === "can_delete") && value) {
            updates.can_view = true
          }
          return { ...perm, ...updates }
        }
        return perm
      }),
    )
    setModifiedPermissions((prev) => new Set(prev).add(id))
  }

  const savePermissions = async () => {
    try {
      setSaving(true)
      const permissionsToSave = permissions.filter((p) => modifiedPermissions.has(p.id))

      const results = await Promise.all(
        permissionsToSave.map((perm) =>
          fetch("/api/role-permissions", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(perm),
          }),
        ),
      )

      const failedCount = results.filter((r) => !r.ok).length
      if (failedCount > 0) {
        throw new Error(`${failedCount} Berechtigungen konnten nicht gespeichert werden`)
      }

      setModifiedPermissions(new Set())
      toast({
        title: "Erfolgreich gespeichert",
        description: `${permissionsToSave.length} Berechtigungen wurden aktualisiert.`,
      })
    } catch (err) {
      console.error("Error saving permissions:", err)
      toast({
        title: "Fehler beim Speichern",
        description: err instanceof Error ? err.message : "Berechtigungen konnten nicht gespeichert werden",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const initializePermissions = async () => {
    try {
      setInitializing(true)
      setError(null)

      const response = await fetch("/api/role-permissions/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to initialize permissions")
      }

      const data = await response.json()
      toast({
        title: "Berechtigungen initialisiert",
        description: `${data.count || 0} Standard-Berechtigungen wurden erstellt.`,
      })

      await loadPermissions()
    } catch (err) {
      console.error("Error initializing permissions:", err)
      setError(err instanceof Error ? err.message : "Failed to initialize permissions")
      toast({
        title: "Fehler",
        description: "Berechtigungen konnten nicht initialisiert werden",
        variant: "destructive",
      })
    } finally {
      setInitializing(false)
    }
  }

  const groupedPermissions = permissions.reduce(
    (acc, perm) => {
      if (!acc[perm.permission_category]) {
        acc[perm.permission_category] = []
      }
      acc[perm.permission_category].push(perm)
      return acc
    },
    {} as Record<string, RolePermission[]>,
  )

  const permissionsByKey = Object.entries(groupedPermissions).map(([category, perms]) => {
    const byKey: Record<string, Record<string, RolePermission>> = {}
    perms.forEach((perm) => {
      if (!byKey[perm.permission_key]) {
        byKey[perm.permission_key] = {}
      }
      byKey[perm.permission_key][perm.role] = perm
    })
    return { category, permissions: byKey }
  })

  const categories = ["all", ...Object.keys(groupedPermissions)]
  const filteredPermissions =
    activeCategory === "all" ? permissionsByKey : permissionsByKey.filter((p) => p.category === activeCategory)

  const actions = [
    { key: "can_view", label: "Ansehen", icon: Eye },
    { key: "can_create", label: "Erstellen", icon: Plus },
    { key: "can_edit", label: "Bearbeiten", icon: Edit },
    { key: "can_delete", label: "Löschen", icon: Trash },
  ] as const

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Benutzerrechte...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Fehler beim Laden der Benutzerrechte</p>
              <p className="text-sm">{error}</p>
              <p className="text-sm text-muted-foreground">
                Möglicherweise existiert die Tabelle &quot;role_permissions&quot; noch nicht. Führen Sie das Script{" "}
                <code className="bg-muted px-1 rounded">scripts/072_update_role_permissions_all_roles.sql</code> aus.
              </p>
            </div>
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button onClick={loadPermissions} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
          <Button onClick={initializePermissions} disabled={initializing}>
            <Shield className={`h-4 w-4 mr-2 ${initializing ? "animate-spin" : ""}`} />
            {initializing ? "Initialisiert..." : "Berechtigungen erstellen"}
          </Button>
        </div>
      </div>
    )
  }

  if (permissions.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Benutzerrechte Verwaltung
            </CardTitle>
            <CardDescription>Keine Berechtigungen gefunden</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold">Keine Benutzerrechte vorhanden</p>
                <p className="text-sm mt-2">
                  Klicken Sie auf die Schaltfläche unten, um die Standard-Berechtigungen für alle 7 Rollen (Super Admin,
                  Praxis Admin, Admin, Manager, Mitglied, Betrachter, Extern) zu initialisieren.
                </p>
              </AlertDescription>
            </Alert>
            <div className="flex gap-2 mt-4">
              <Button onClick={initializePermissions} disabled={initializing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${initializing ? "animate-spin" : ""}`} />
                {initializing ? "Initialisiert..." : "Standard-Berechtigungen initialisieren"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Benutzerrechte Verwaltung
          </h1>
          <p className="text-muted-foreground mt-1">Verwalten Sie Berechtigungen für alle 7 Benutzerrollen</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadPermissions} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Button onClick={savePermissions} disabled={modifiedPermissions.size === 0 || saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving
              ? "Speichert..."
              : `Speichern${modifiedPermissions.size > 0 ? ` (${modifiedPermissions.size})` : ""}`}
          </Button>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Änderungen an Benutzerrechten werden sofort nach dem Speichern aktiv. Super Admin-Berechtigungen können nicht
          geändert werden.
        </AlertDescription>
      </Alert>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            Alle
          </TabsTrigger>
          {Object.keys(groupedPermissions).map((category) => (
            <TabsTrigger key={category} value={category} className="text-xs sm:text-sm flex items-center gap-1">
              {categoryIcons[category]}
              <span className="hidden lg:inline">{category}</span>
              <span className="lg:hidden">{category.split(" ")[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4 space-y-4">
          {filteredPermissions.map(({ category, permissions: permsByKey }) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {categoryIcons[category]}
                  {category}
                </CardTitle>
                <CardDescription>{Object.keys(permsByKey).length} Funktionen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full border-collapse min-w-[900px]">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold w-[140px]">Funktion</th>
                        <th className="text-left p-3 font-semibold w-[90px]">Aktion</th>
                        {roles.map((role) => (
                          <th key={role} className="text-center p-2 font-semibold min-w-[80px]">
                            <Badge className={`text-xs ${roleColors[role]}`}>{roleLabels[role]}</Badge>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(permsByKey).map(([key, rolePerms]) => (
                        <React.Fragment key={key}>
                          {actions.map((action, actionIndex) => {
                            const ActionIcon = action.icon
                            const isFirstAction = actionIndex === 0

                            return (
                              <tr
                                key={`${key}-${action.key}`}
                                className={`border-b hover:bg-muted/30 transition-colors ${
                                  isFirstAction ? "border-t-2 border-t-muted" : ""
                                }`}
                              >
                                {isFirstAction && (
                                  <td
                                    rowSpan={actions.length}
                                    className="p-3 font-medium capitalize border-r align-middle bg-muted/20"
                                  >
                                    <span className="text-sm">{key.replace(/_/g, " ")}</span>
                                  </td>
                                )}
                                <td className="p-2 border-r">
                                  <div className="flex items-center gap-1.5">
                                    <ActionIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs">{action.label}</span>
                                  </div>
                                </td>
                                {roles.map((role) => {
                                  const perm = rolePerms[role]
                                  if (!perm)
                                    return (
                                      <td key={`${key}-${role}`} className="p-2 text-center">
                                        -
                                      </td>
                                    )

                                  const fieldKey = action.key as keyof Pick<
                                    RolePermission,
                                    "can_view" | "can_create" | "can_edit" | "can_delete"
                                  >

                                  return (
                                    <td key={`${key}-${role}-${action.key}`} className="p-2 text-center">
                                      <div className="flex justify-center">
                                        <Checkbox
                                          checked={perm[fieldKey]}
                                          onCheckedChange={(checked) =>
                                            handlePermissionChange(perm.id, fieldKey, checked as boolean)
                                          }
                                          disabled={role === "superadmin"}
                                          className={modifiedPermissions.has(perm.id) ? "border-primary" : ""}
                                        />
                                      </div>
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Rollen-Legende</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 text-sm">
            {AVAILABLE_ROLES.map((role) => (
              <div key={role.value} className="flex items-center gap-2">
                <Badge className={role.badgeColor}>{role.label}</Badge>
                <span className="text-xs text-muted-foreground hidden md:inline">{role.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default UserRightsManager

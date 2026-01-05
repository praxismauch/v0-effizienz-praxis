"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Shield,
  Search,
  RefreshCw,
  Download,
  Settings2,
  AlertTriangle,
  Eye,
  Plus,
  Edit,
  Trash2,
  RotateCcw,
  MoreVertical,
  Grid3X3,
  List,
} from "lucide-react"
import { toast } from "sonner"
import { useSuperAdminPermissions, type Permission } from "@/lib/hooks/use-super-admin-permissions"

// Permission action labels - no hardcoding
const PERMISSION_ACTIONS = {
  can_view: { label: "Ansehen", icon: Eye, color: "text-blue-500" },
  can_create: { label: "Erstellen", icon: Plus, color: "text-green-500" },
  can_edit: { label: "Bearbeiten", icon: Edit, color: "text-yellow-500" },
  can_delete: { label: "Löschen", icon: Trash2, color: "text-red-500" },
} as const

// Permission key labels - no hardcoding
const PERMISSION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  analytics: "Analysen",
  team: "Team",
  hiring: "Recruiting",
  training: "Fortbildungen",
  skills: "Qualifikationen",
  calendar: "Kalender",
  tasks: "Aufgaben",
  goals: "Ziele",
  workflows: "Workflows",
  documents: "Dokumente",
  knowledge: "Wissensdatenbank",
  contacts: "Kontakte",
  settings: "Einstellungen",
  security: "Sicherheit",
  users: "Benutzer",
  billing: "Abrechnung",
  reports: "Berichte",
}

export default function PermissionsManager() {
  const {
    permissions,
    stats,
    roleConfig,
    categories,
    tableExists,
    tableError,
    isLoading,
    error,
    refresh,
    updatePermission,
    initializePermissions,
    resetPermissions,
  } = useSuperAdminPermissions()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"matrix" | "list">("matrix")
  const [isInitializing, setIsInitializing] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetRole, setResetRole] = useState<string | undefined>()

  // Get unique categories and roles from data
  const uniqueCategories = useMemo(() => {
    const cats = [...new Set(permissions.map((p) => p.permission_category))]
    return cats.sort()
  }, [permissions])

  const uniqueRoles = useMemo(() => {
    const roles = [...new Set(permissions.map((p) => p.role))]
    return roles.sort((a, b) => {
      const orderA = roleConfig[a]?.order || 999
      const orderB = roleConfig[b]?.order || 999
      return orderA - orderB
    })
  }, [permissions, roleConfig])

  // Get unique permission keys
  const uniquePermissionKeys = useMemo(() => {
    return [...new Set(permissions.map((p) => p.permission_key))]
  }, [permissions])

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      const matchesSearch =
        searchQuery === "" ||
        p.permission_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.permission_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (PERMISSION_LABELS[p.permission_key] || "").toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCategory === "all" || p.permission_category === selectedCategory
      const matchesRole = selectedRole === "all" || p.role === selectedRole

      return matchesSearch && matchesCategory && matchesRole
    })
  }, [permissions, searchQuery, selectedCategory, selectedRole])

  // Group permissions by category for matrix view
  const permissionsByCategory = useMemo(() => {
    const grouped: Record<string, Record<string, Record<string, Permission>>> = {}

    for (const perm of filteredPermissions) {
      if (!grouped[perm.permission_category]) {
        grouped[perm.permission_category] = {}
      }
      if (!grouped[perm.permission_category][perm.permission_key]) {
        grouped[perm.permission_category][perm.permission_key] = {}
      }
      grouped[perm.permission_category][perm.permission_key][perm.role] = perm
    }

    return grouped
  }, [filteredPermissions])

  // Handle permission toggle
  const handleToggle = async (permission: Permission, action: keyof typeof PERMISSION_ACTIONS) => {
    const newValue = !permission[action]
    await updatePermission(permission.id, permission.role, permission.permission_key, {
      [action]: newValue,
    })
  }

  // Handle initialize
  const handleInitialize = async () => {
    setIsInitializing(true)
    await initializePermissions()
    setIsInitializing(false)
  }

  // Handle reset
  const handleReset = async () => {
    setIsResetting(true)
    await resetPermissions(resetRole)
    setIsResetting(false)
    setResetDialogOpen(false)
    setResetRole(undefined)
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Kategorie", "Berechtigung", "Rolle", "Ansehen", "Erstellen", "Bearbeiten", "Löschen"]
    const rows = filteredPermissions.map((p) => [
      p.permission_category,
      PERMISSION_LABELS[p.permission_key] || p.permission_key,
      roleConfig[p.role]?.label || p.role,
      p.can_view ? "Ja" : "Nein",
      p.can_create ? "Ja" : "Nein",
      p.can_edit ? "Ja" : "Nein",
      p.can_delete ? "Ja" : "Nein",
    ])

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `berechtigungen_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exportiert")
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-32 bg-muted rounded-lg" />
        <div className="animate-pulse h-96 bg-muted rounded-lg" />
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Fehler</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }

  // Render table not exists state
  if (!tableExists) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Tabelle nicht gefunden
          </CardTitle>
          <CardDescription>Die Berechtigungstabelle existiert nicht in der Datenbank.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>SQL-Script erforderlich</AlertTitle>
            <AlertDescription>
              Bitte führen Sie das SQL-Script{" "}
              <code className="bg-muted px-1 rounded">scripts/071_create_role_permissions_table.sql</code> aus, um die
              Tabelle zu erstellen.
            </AlertDescription>
          </Alert>
          <Button onClick={handleInitialize} disabled={isInitializing}>
            <Settings2 className="h-4 w-4 mr-2" />
            {isInitializing ? "Initialisiere..." : "Nach Erstellung initialisieren"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Berechtigungen</p>
                <p className="text-2xl font-bold">{stats?.totalPermissions || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rollen</p>
                <p className="text-2xl font-bold">{stats?.roles || 0}</p>
              </div>
              <div className="flex -space-x-1">
                {uniqueRoles.slice(0, 3).map((role) => (
                  <div key={role} className={`h-6 w-6 rounded-full ${roleConfig[role]?.color || "bg-gray-500"}`} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kategorien</p>
                <p className="text-2xl font-bold">{stats?.categories || 0}</p>
              </div>
              <Grid3X3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Features</p>
                <p className="text-2xl font-bold">{uniquePermissionKeys.length}</p>
              </div>
              <Settings2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Berechtigung suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Rolle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Rollen</SelectItem>
                {uniqueRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleConfig[role]?.label || role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "matrix" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("matrix")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => refresh()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Aktualisieren
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV Export
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleInitialize} disabled={isInitializing}>
                  <Settings2 className="h-4 w-4 mr-2" />
                  Initialisieren
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setResetDialogOpen(true)} className="text-destructive">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Zurücksetzen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Display */}
      {permissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Berechtigungen vorhanden</h3>
            <p className="text-muted-foreground mb-4">
              Initialisieren Sie die Standard-Berechtigungen, um zu beginnen.
            </p>
            <Button onClick={handleInitialize} disabled={isInitializing}>
              <Settings2 className="h-4 w-4 mr-2" />
              {isInitializing ? "Initialisiere..." : "Berechtigungen initialisieren"}
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "matrix" ? (
        // Matrix View
        <div className="space-y-6">
          {Object.entries(permissionsByCategory).map(([category, permKeys]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
                <CardDescription>{Object.keys(permKeys).length} Berechtigungen in dieser Kategorie</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-48">Feature</TableHead>
                        {uniqueRoles.map((role) => (
                          <TableHead key={role} className="text-center min-w-32">
                            <Badge
                              variant="outline"
                              className={`${roleConfig[role]?.color || "bg-gray-500"} text-white border-0`}
                            >
                              {roleConfig[role]?.label || role}
                            </Badge>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(permKeys).map(([permKey, rolePerms]) => (
                        <TableRow key={permKey}>
                          <TableCell className="font-medium">{PERMISSION_LABELS[permKey] || permKey}</TableCell>
                          {uniqueRoles.map((role) => {
                            const perm = rolePerms[role]
                            if (!perm) return <TableCell key={role} />
                            return (
                              <TableCell key={role}>
                                <div className="flex justify-center gap-1">
                                  {(Object.keys(PERMISSION_ACTIONS) as (keyof typeof PERMISSION_ACTIONS)[]).map(
                                    (action) => {
                                      const ActionIcon = PERMISSION_ACTIONS[action].icon
                                      const isEnabled = perm[action]
                                      return (
                                        <Button
                                          key={action}
                                          variant="ghost"
                                          size="sm"
                                          className={`h-7 w-7 p-0 ${isEnabled ? PERMISSION_ACTIONS[action].color : "text-muted-foreground opacity-30"}`}
                                          onClick={() => handleToggle(perm, action)}
                                          title={PERMISSION_ACTIONS[action].label}
                                        >
                                          <ActionIcon className="h-4 w-4" />
                                        </Button>
                                      )
                                    },
                                  )}
                                </div>
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // List View
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead className="text-center">Ansehen</TableHead>
                  <TableHead className="text-center">Erstellen</TableHead>
                  <TableHead className="text-center">Bearbeiten</TableHead>
                  <TableHead className="text-center">Löschen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.map((perm) => (
                  <TableRow key={perm.id}>
                    <TableCell>{perm.permission_category}</TableCell>
                    <TableCell className="font-medium">
                      {PERMISSION_LABELS[perm.permission_key] || perm.permission_key}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${roleConfig[perm.role]?.color || "bg-gray-500"} text-white border-0`}
                      >
                        {roleConfig[perm.role]?.label || perm.role}
                      </Badge>
                    </TableCell>
                    {(Object.keys(PERMISSION_ACTIONS) as (keyof typeof PERMISSION_ACTIONS)[]).map((action) => (
                      <TableCell key={action} className="text-center">
                        <Checkbox checked={perm[action]} onCheckedChange={() => handleToggle(perm, action)} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Berechtigungen zurücksetzen</DialogTitle>
            <DialogDescription>
              Möchten Sie alle Berechtigungen oder nur für eine bestimmte Rolle zurücksetzen?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={resetRole || "all"} onValueChange={(v) => setResetRole(v === "all" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Rolle auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Rollen</SelectItem>
                {uniqueRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleConfig[role]?.label || role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Achtung</AlertTitle>
              <AlertDescription>
                {resetRole
                  ? `Alle Berechtigungen für "${roleConfig[resetRole]?.label || resetRole}" werden gelöscht.`
                  : "Alle Berechtigungen werden gelöscht."}{" "}
                Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={isResetting}>
              {isResetting ? "Setze zurück..." : "Zurücksetzen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

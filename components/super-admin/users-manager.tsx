"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Pencil,
  Trash2,
  MoreHorizontal,
  Download,
  RefreshCw,
  Shield,
  UserPlus,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useSuperAdminUsers } from "@/lib/hooks/use-super-admin-users"
import { isSuperAdminRole } from "@/lib/auth-utils"

// Role configuration - no hardcoding
const ROLE_CONFIG = {
  superadmin: { label: "Super Admin", color: "destructive" as const, icon: Shield },
  super_admin: { label: "Super Admin", color: "destructive" as const, icon: Shield },
  practiceadmin: { label: "Praxis Admin", color: "default" as const, icon: UserCheck },
  practice_admin: { label: "Praxis Admin", color: "default" as const, icon: UserCheck },
  admin: { label: "Admin", color: "default" as const, icon: UserCheck },
  manager: { label: "Manager", color: "secondary" as const, icon: Users },
  poweruser: { label: "Hauptnutzer", color: "secondary" as const, icon: Users },
  member: { label: "Mitglied", color: "outline" as const, icon: Users },
  user: { label: "Nutzer", color: "outline" as const, icon: Users },
  viewer: { label: "Betrachter", color: "outline" as const, icon: Users },
  extern: { label: "Extern", color: "outline" as const, icon: Users },
}

const AVAILABLE_ROLES = [
  { value: "superadmin", label: "Super Admin" },
  { value: "practiceadmin", label: "Praxis Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "Mitglied" },
  { value: "viewer", label: "Betrachter" },
  { value: "extern", label: "Extern" },
]

export default function UsersManager() {
  const { users, stats, practices, isLoading, error, refresh, createUser, updateUser, deleteUser, toggleUserActive } =
    useSuperAdminUsers()

  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [practiceFilter, setPracticeFilter] = useState<string>("all")

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<(typeof users)[0] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "member",
    practiceId: "",
    preferred_language: "de",
    phone: "",
    specialization: "",
  })

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
      role: "member",
      practiceId: "",
      preferred_language: "de",
      phone: "",
      specialization: "",
    })
  }

  const parsePracticeId = (value: string): string | undefined => {
    if (!value || value === "none" || value === "") {
      return undefined
    }
    // Return as string since database expects TEXT type for practice_id
    return value
  }

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        practiceId: parsePracticeId(formData.practiceId),
        preferred_language: formData.preferred_language,
      })

      toast({
        title: "Erfolg",
        description: `Benutzer "${formData.name}" wurde erfolgreich erstellt.`,
      })
      setShowCreateDialog(false)
      resetForm()
    } catch (error) {
      console.error("[v0] User creation error:", error)
      const errorMessage = error instanceof Error ? error.message : "Database error creating new user"
      console.error("[v0] Error message:", errorMessage)
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    setIsSubmitting(true)
    try {
      const practiceIdValue = parsePracticeId(formData.practiceId)
      await updateUser(editingUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        practice_id: practiceIdValue === undefined ? null : practiceIdValue,
        preferred_language: formData.preferred_language,
        phone: formData.phone || null,
        specialization: formData.specialization || null,
      })

      toast({
        title: "Erfolg",
        description: `Benutzer "${formData.name}" wurde aktualisiert.`,
      })
      setEditingUser(null)
      resetForm()
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Benutzer konnte nicht aktualisiert werden.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Möchten Sie den Benutzer "${userName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      )
    ) {
      return
    }

    try {
      await deleteUser(userId)
      toast({
        title: "Erfolg",
        description: `Benutzer "${userName}" wurde gelöscht.`,
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Benutzer konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (userId: string, userName: string, currentStatus: boolean) => {
    try {
      await toggleUserActive(userId, currentStatus)
      toast({
        title: "Erfolg",
        description: `Benutzer "${userName}" wurde ${!currentStatus ? "aktiviert" : "deaktiviert"}.`,
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Status konnte nicht geändert werden.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (user: (typeof users)[0]) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: "",
      name: user.name,
      role: user.role,
      practiceId: user.practice_id?.toString() || "",
      preferred_language: user.preferred_language || "de",
      phone: user.phone || "",
      specialization: user.specialization || "",
    })
  }

  const handleExportCSV = () => {
    const headers = ["ID", "Name", "E-Mail", "Rolle", "Praxis", "Status", "Erstellt", "Letzter Login"]
    const rows = users.map((u) => [
      u.id,
      u.name,
      u.email,
      getRoleLabel(u.role),
      u.practice_name || "Keine",
      u.is_active ? "Aktiv" : "Inaktiv",
      new Date(u.created_at).toLocaleDateString("de-DE"),
      u.last_login ? new Date(u.last_login).toLocaleDateString("de-DE") : "Nie",
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `benutzer_export_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const getRoleLabel = (role: string) => {
    return ROLE_CONFIG[role as keyof typeof ROLE_CONFIG]?.label || role
  }

  const getRoleColor = (role: string) => {
    return ROLE_CONFIG[role as keyof typeof ROLE_CONFIG]?.color || "outline"
  }

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.practice_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

    const matchesRole =
      roleFilter === "all" || user.role === roleFilter || (roleFilter === "superadmin" && isSuperAdminRole(user.role))

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active)

    const matchesPractice =
      practiceFilter === "all" ||
      user.practice_id?.toString() === practiceFilter ||
      (practiceFilter === "none" && !user.practice_id)

    return matchesSearch && matchesRole && matchesStatus && matchesPractice
  })

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <UserX className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-destructive">{error.message}</p>
            <Button variant="outline" className="mt-4 bg-transparent" onClick={() => refresh()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Erneut versuchen
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Alle Benutzer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiv</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Aktive Benutzer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inaktiv</CardTitle>
            <UserX className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Inaktive Benutzer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.superAdmins}</div>
            <p className="text-xs text-muted-foreground">System-Administratoren</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Benutzerverwaltung</CardTitle>
              <CardDescription>Verwalten Sie alle Systembenutzer und deren Zugriffsrechte</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refresh()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportieren
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Neuer Benutzer
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Benutzer suchen..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Rolle filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Rollen</SelectItem>
                {AVAILABLE_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
              </SelectContent>
            </Select>

            <Select value={practiceFilter} onValueChange={setPracticeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Praxis filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Praxen</SelectItem>
                <SelectItem value="none">Ohne Praxis</SelectItem>
                {practices.map((practice) => (
                  <SelectItem key={practice.id} value={practice.id.toString()}>
                    {practice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Benutzer werden geladen...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || roleFilter !== "all" || statusFilter !== "all" || practiceFilter !== "all"
                  ? "Keine Benutzer gefunden"
                  : "Noch keine Benutzer vorhanden"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Praxis</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.practice_name ? (
                          <div className="flex items-center gap-2">
                            {user.practice_color && (
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.practice_color }} />
                            )}
                            <span className="text-sm">{user.practice_name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Keine Praxis</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleColor(user.role)}>{getRoleLabel(user.role)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(user.id, user.name, user.is_active)}
                              disabled={isSuperAdminRole(user.role) && user.is_active}
                            >
                              {user.is_active ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deaktivieren
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Aktivieren
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              disabled={isSuperAdminRole(user.role)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Neuen Benutzer erstellen</DialogTitle>
            <DialogDescription>Erstellen Sie einen neuen Benutzer im System.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Max Mustermann"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="max@beispiel.de"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Passwort *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mindestens 8 Zeichen"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="role">Rolle</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rolle wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="practice">Praxis</Label>
                <Select
                  value={formData.practiceId}
                  onValueChange={(value) => setFormData({ ...formData, practiceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Praxis wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Praxis</SelectItem>
                    {practices.map((practice) => (
                      <SelectItem key={practice.id} value={practice.id.toString()}>
                        {practice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateUser} disabled={isSubmitting}>
              {isSubmitting ? "Wird erstellt..." : "Benutzer erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Benutzer bearbeiten</DialogTitle>
            <DialogDescription>Bearbeiten Sie die Benutzerinformationen.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">E-Mail *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Rolle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  disabled={editingUser && isSuperAdminRole(editingUser.role)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rolle wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-practice">Praxis</Label>
                <Select
                  value={formData.practiceId}
                  onValueChange={(value) => setFormData({ ...formData, practiceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Praxis wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Praxis</SelectItem>
                    {practices.map((practice) => (
                      <SelectItem key={practice.id} value={practice.id.toString()}>
                        {practice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Telefon</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+49 123 456789"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-specialization">Spezialisierung</Label>
                <Input
                  id="edit-specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="z.B. Zahnmedizin"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting ? "Wird gespeichert..." : "Änderungen speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

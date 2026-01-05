"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Circle,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import {
  useSuperAdminTeams,
  useSuperAdminDefaultTeams,
  type DefaultTeam,
  type PracticeTeam,
} from "@/lib/hooks/use-super-admin-teams"

const TEAM_COLORS = [
  { value: "#3b82f6", label: "Blau" },
  { value: "#10b981", label: "Grün" },
  { value: "#f59e0b", label: "Orange" },
  { value: "#ef4444", label: "Rot" },
  { value: "#8b5cf6", label: "Lila" },
  { value: "#ec4899", label: "Pink" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#64748b", label: "Grau" },
] as const

export default function TeamsManager() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("default-teams")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [practiceFilter, setPracticeFilter] = useState<string>("all")

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<DefaultTeam | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    color: "#3b82f6",
    description: "",
    display_order: 0,
    syncToPractices: true,
  })

  // Use SWR hooks
  const {
    defaultTeams,
    isLoading: defaultTeamsLoading,
    error: defaultTeamsError,
    refresh: refreshDefaultTeams,
    createDefaultTeam,
    updateDefaultTeam,
    deleteDefaultTeam,
    syncAllTeams,
  } = useSuperAdminDefaultTeams()

  const {
    teams: practiceTeams,
    stats,
    isLoading: practiceTeamsLoading,
    error: practiceTeamsError,
    refresh: refreshPracticeTeams,
  } = useSuperAdminTeams()

  const tablesNotFound =
    defaultTeamsError?.message?.includes("TABLE_NOT_FOUND") || practiceTeamsError?.message?.includes("TABLE_NOT_FOUND")

  // Get unique practices for filter
  const uniquePractices = Array.from(
    new Map(practiceTeams.filter((t) => t.practice).map((t) => [t.practice!.id, t.practice!])).values(),
  )

  // Filter practice teams
  const filteredPracticeTeams = practiceTeams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.practice?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && team.is_active) ||
      (statusFilter === "inactive" && !team.is_active) ||
      (statusFilter === "default" && team.is_default)

    const matchesPractice = practiceFilter === "all" || String(team.practice_id) === practiceFilter

    return matchesSearch && matchesStatus && matchesPractice
  })

  // Handlers
  const handleCreateTeam = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Fehler", description: "Name ist erforderlich", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createDefaultTeam(formData)
      toast({ title: "Erfolg", description: result.message })
      setCreateDialogOpen(false)
      resetForm()
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTeam = async () => {
    if (!selectedTeam || !formData.name.trim()) {
      toast({ title: "Fehler", description: "Name ist erforderlich", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await updateDefaultTeam(selectedTeam.id, {
        name: formData.name,
        color: formData.color,
        description: formData.description,
        display_order: formData.display_order,
        syncChanges: formData.syncToPractices,
      })
      toast({ title: "Erfolg", description: result.message })
      setEditDialogOpen(false)
      resetForm()
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return

    setIsSubmitting(true)
    try {
      const result = await deleteDefaultTeam(selectedTeam.id)
      toast({ title: "Erfolg", description: result.message })
      setDeleteDialogOpen(false)
      setSelectedTeam(null)
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSyncAll = async () => {
    setIsSyncing(true)
    try {
      const result = await syncAllTeams()
      toast({
        title: "Synchronisierung abgeschlossen",
        description: result.message,
      })
      refreshPracticeTeams()
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" })
    } finally {
      setIsSyncing(false)
    }
  }

  const openEditDialog = (team: DefaultTeam) => {
    setSelectedTeam(team)
    setFormData({
      name: team.name,
      color: team.color,
      description: team.description || "",
      display_order: team.display_order,
      syncToPractices: true,
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (team: DefaultTeam) => {
    setSelectedTeam(team)
    setDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      color: "#3b82f6",
      description: "",
      display_order: 0,
      syncToPractices: true,
    })
    setSelectedTeam(null)
  }

  const exportToCSV = () => {
    const data = activeTab === "default-teams" ? defaultTeams : filteredPracticeTeams
    const headers =
      activeTab === "default-teams"
        ? ["Name", "Farbe", "Beschreibung", "Reihenfolge", "Status", "Praxen"]
        : ["Name", "Praxis", "Farbe", "Mitglieder", "Status", "Standard"]

    const rows = data.map((item) => {
      if (activeTab === "default-teams") {
        const dt = item as DefaultTeam
        return [
          dt.name,
          dt.color,
          dt.description || "",
          dt.display_order,
          dt.is_active ? "Aktiv" : "Inaktiv",
          `${dt.practiceCount || 0}/${dt.totalPractices || 0}`,
        ]
      } else {
        const pt = item as PracticeTeam
        return [
          pt.name,
          pt.practice?.name || "-",
          pt.color,
          pt.memberCount,
          pt.is_active ? "Aktiv" : "Inaktiv",
          pt.is_default ? "Ja" : "Nein",
        ]
      }
    })

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `teams-export-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const getSyncStatusIcon = (status?: string) => {
    switch (status) {
      case "synced":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "partial":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (tablesNotFound) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Datenbank-Tabellen fehlen</AlertTitle>
          <AlertDescription>
            Die Tabellen für die Teamverwaltung existieren nicht in der Datenbank. Bitte führen Sie das SQL-Script{" "}
            <code className="bg-muted px-1 rounded">scripts/070_create_teams_tables.sql</code> aus, um die
            erforderlichen Tabellen zu erstellen.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gesamt Teams</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aktive Teams</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Standard-Teams</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{defaultTeams.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Praxen mit Teams</CardDescription>
            <CardTitle className="text-2xl">{stats.practicesWithTeams}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gesamt Mitglieder</CardDescription>
            <CardTitle className="text-2xl">{stats.totalMembers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inaktive Teams</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">{stats.inactive}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teamverwaltung
              </CardTitle>
              <CardDescription>Verwalten Sie Standard-Teams und Praxis-Teams</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refreshDefaultTeams()
                  refreshPracticeTeams()
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="default-teams">Standard-Teams</TabsTrigger>
              <TabsTrigger value="practice-teams">Praxis-Teams</TabsTrigger>
            </TabsList>

            {/* Default Teams Tab */}
            <TabsContent value="default-teams" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-2">
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Neues Standard-Team
                  </Button>
                  <Button variant="outline" onClick={handleSyncAll} disabled={isSyncing}>
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Alle synchronisieren
                  </Button>
                </div>
              </div>

              {defaultTeamsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : defaultTeams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Keine Standard-Teams vorhanden. Erstellen Sie ein neues Team.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Ord.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Farbe</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead>Praxen</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {defaultTeams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell>{team.display_order}</TableCell>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded border" style={{ backgroundColor: team.color }} />
                            <span className="text-sm text-muted-foreground">{team.color}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{team.description || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSyncStatusIcon(team.syncStatus)}
                            <span className="text-sm">
                              {team.practiceCount || 0}/{team.totalPractices || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={team.is_active ? "default" : "secondary"}>
                            {team.is_active ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(team)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(team)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Practice Teams Tab */}
            <TabsContent value="practice-teams" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Suche nach Team oder Praxis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                    <SelectItem value="default">Standard</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={practiceFilter} onValueChange={setPracticeFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Praxis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Praxen</SelectItem>
                    {uniquePractices.map((practice) => (
                      <SelectItem key={practice.id} value={String(practice.id)}>
                        {practice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {practiceTeamsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPracticeTeams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Keine Teams gefunden.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Praxis</TableHead>
                      <TableHead>Farbe</TableHead>
                      <TableHead>Mitglieder</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Typ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPracticeTeams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {team.practice?.color && (
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.practice.color }} />
                            )}
                            <span>{team.practice?.name || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded border" style={{ backgroundColor: team.color }} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{team.memberCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={team.is_active ? "default" : "secondary"}>
                            {team.is_active ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {team.is_default ? (
                            <Badge variant="outline" className="text-blue-600">
                              Standard
                            </Badge>
                          ) : (
                            <Badge variant="outline">Benutzerdefiniert</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Standard-Team erstellen</DialogTitle>
            <DialogDescription>Dieses Team wird automatisch für alle Praxen erstellt.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Ärzte, MFA, Verwaltung"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Farbe</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: c.value }} />
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optionale Beschreibung"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_order">Anzeigereihenfolge</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: Number.parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="syncToPractices"
                checked={formData.syncToPractices}
                onCheckedChange={(checked) => setFormData({ ...formData, syncToPractices: checked })}
              />
              <Label htmlFor="syncToPractices">Sofort zu allen Praxen hinzufügen</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateTeam} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Standard-Team bearbeiten</DialogTitle>
            <DialogDescription>Änderungen können auf alle Praxen angewendet werden.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Farbe</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: c.value }} />
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Beschreibung</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-display_order">Anzeigereihenfolge</Label>
              <Input
                id="edit-display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: Number.parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-syncToPractices"
                checked={formData.syncToPractices}
                onCheckedChange={(checked) => setFormData({ ...formData, syncToPractices: checked })}
              />
              <Label htmlFor="edit-syncToPractices">Änderungen auf alle Praxen anwenden</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdateTeam} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Standard-Team löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Team &quot;{selectedTeam?.name}&quot; wird aus allen Praxen entfernt. Diese Aktion kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

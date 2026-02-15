"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Pencil, Trash2, RefreshCw, Users } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface DefaultTeam {
  id: string
  name: string
  color: string
  description: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export function DefaultTeamsManager() {
  const [defaultTeams, setDefaultTeams] = useState<DefaultTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [tableNotFound, setTableNotFound] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<DefaultTeam | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    color: "#3b82f6",
    description: "",
    display_order: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchDefaultTeams()
  }, [])

  const fetchDefaultTeams = async () => {
    try {
      const response = await fetch("/api/super-admin/default-teams")
      const data = await response.json()

      if (response.ok) {
        const teams = data.defaultTeams || []
        teams.sort((a: DefaultTeam, b: DefaultTeam) => {
          if (a.display_order !== undefined && b.display_order !== undefined) {
            return a.display_order - b.display_order
          }
          return a.name.localeCompare(b.name)
        })
        setDefaultTeams(teams)
        setTableNotFound(false)
      } else {
        if (response.status === 404 || data.error?.includes("default_teams")) {
          setTableNotFound(true)
        }
        toast({
          title: "Fehler",
          description: data.error || "Fehler beim Laden der Standard-Teams",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error fetching default teams:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Standard-Teams",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingTeam ? `/api/super-admin/default-teams/${editingTeam.id}` : "/api/super-admin/default-teams"

      const response = await fetch(url, {
        method: editingTeam ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          is_active: true,
        }),
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: editingTeam
            ? "Standard-Team erfolgreich aktualisiert"
            : "Standard-Team erfolgreich erstellt und auf alle Praxen angewendet",
        })
        fetchDefaultTeams()
        setDialogOpen(false)
        resetForm()
      } else {
        const data = await response.json()
        toast({
          title: "Fehler",
          description: data.error || "Fehler beim Speichern des Teams",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error saving default team:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Speichern des Teams",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (team: DefaultTeam) => {
    setEditingTeam(team)
    setFormData({
      name: team.name || "",
      color: team.color || "#3b82f6",
      description: team.description || "",
      display_order: team.display_order ?? 0,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (teamId: string) => {
    if (!confirm("Möchten Sie dieses Standard-Team wirklich löschen? Es wird aus allen Praxen entfernt.")) {
      return
    }

    try {
      const response = await fetch(`/api/super-admin/default-teams/${teamId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: "Standard-Team erfolgreich gelöscht",
        })
        fetchDefaultTeams()
      } else {
        toast({
          title: "Fehler",
          description: "Fehler beim Löschen des Teams",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error deleting default team:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen des Teams",
        variant: "destructive",
      })
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/super-admin/default-teams/sync", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: data.message,
        })
      } else {
        toast({
          title: "Fehler",
          description: "Fehler beim Synchronisieren der Teams",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error syncing teams:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Synchronisieren der Teams",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      color: "#3b82f6",
      description: "",
      display_order: 0,
    })
    setEditingTeam(null)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Standard-Teams werden geladen...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (tableNotFound) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Standard-Teams Setup erforderlich
          </CardTitle>
          <CardDescription>Die Datenbanktabelle für Standard-Teams wurde noch nicht erstellt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="font-semibold text-amber-900 mb-2">Setup-Anleitung:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-amber-800">
              <li>Öffnen Sie den "scripts" Ordner im Projekt</li>
              <li>Führen Sie die Datei "add-default-teams-system.sql" aus</li>
              <li>Klicken Sie auf "Neu laden" unten, um die Seite zu aktualisieren</li>
            </ol>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="font-medium text-blue-900 mb-2">SQL-Script:</h4>
            <code className="text-xs text-blue-800 block">scripts/add-default-teams-system.sql</code>
          </div>
          <Button onClick={fetchDefaultTeams} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Neu laden
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Standard-Teams für alle Praxen
              </CardTitle>
              <CardDescription>
                Diese Teams werden automatisch für alle neuen Praxen erstellt und können von Praxis-Admins nicht
                gelöscht werden
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSync} disabled={syncing} variant="outline">
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Synchronisiere..." : "Auf alle Praxen anwenden"}
              </Button>
              <Button
                onClick={() => {
                  resetForm()
                  setDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Neues Standard-Team
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {defaultTeams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Standard-Teams vorhanden. Erstellen Sie ein neues Team.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reihenfolge</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Farbe</TableHead>
                  <TableHead>Beschreibung</TableHead>
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
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: team.color }} />
                        <span className="text-sm text-muted-foreground">{team.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>{team.description || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={team.is_active ? "default" : "secondary"}>
                        {team.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(team)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(team.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTeam ? "Standard-Team bearbeiten" : "Neues Standard-Team"}</DialogTitle>
            <DialogDescription>
              {editingTeam
                ? "Änderungen werden auf alle Praxen angewendet"
                : "Dieses Team wird automatisch für alle Praxen erstellt"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name ?? ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="z.B. Arzt, MFA, Verwaltung"
              />
            </div>
            <div>
              <Label htmlFor="color">Farbe *</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color ?? "#3b82f6"}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20"
                />
                <Input
                  type="text"
                  value={formData.color ?? ""}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description ?? ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optionale Beschreibung des Teams"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="display_order">Anzeigereihenfolge</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order ?? 0}
                onChange={(e) => setFormData({ ...formData, display_order: Number.parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit">{editingTeam ? "Aktualisieren" : "Erstellen"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DefaultTeamsManager

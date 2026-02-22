"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Eye, EyeOff, RefreshCw, MessageSquare } from "lucide-react"
import { ColorPicker } from "@/components/color-picker"

interface Popup {
  id: string
  title: string
  content: string
  button_text: string | null
  button_link: string | null
  image_url: string | null
  background_color: string
  text_color: string
  is_active: boolean
  display_frequency: string
  target_pages: string[]
  start_date: string | null
  end_date: string | null
  display_order: number
  created_at: string
  updated_at: string
}

function PopupManager() {
  const [popups, setPopups] = useState<Popup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    button_text: "",
    button_link: "",
    image_url: "",
    background_color: "#ffffff",
    text_color: "#000000",
    is_active: true,
    display_frequency: "once",
    target_pages: [] as string[],
    start_date: "",
    end_date: "",
    display_order: 0,
  })

  useEffect(() => {
    fetchPopups()
  }, [])

  const fetchPopups = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/popups", {
        credentials: "include",
      })

      if (!response.ok) {
        console.error("[v0] Error fetching popups - status:", response.status)
        toast({
          title: "Fehler",
          description: `Popups konnten nicht geladen werden (Status: ${response.status})`,
          variant: "destructive",
        })
        setPopups([])
        return
      }

      const data = await response.json()
      setPopups(data.popups || [])
    } catch (error) {
      console.error("[v0] Error fetching popups:", error)
      toast({
        title: "Fehler",
        description: "Netzwerkfehler beim Laden der Popups",
        variant: "destructive",
      })
      setPopups([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateOrUpdate = async () => {
    try {
      const url = editingPopup ? `/api/popups/${editingPopup.id}` : "/api/popups"
      const method = editingPopup ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      })

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        let errorMessage = "Popup konnte nicht gespeichert werden"

        if (contentType && contentType.includes("application/json")) {
          const data = await response.json()
          errorMessage = data.error || data.details || errorMessage
        } else {
          const text = await response.text()
          console.error("[v0] Non-JSON response:", text.substring(0, 200))
          errorMessage = `Server error (${response.status})`
        }

        console.error("[v0] Error saving popup - status:", response.status)
        toast({
          title: "Fehler",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      const data = await response.json()

      toast({
        title: "Erfolg",
        description: editingPopup ? "Popup aktualisiert" : "Popup erstellt",
      })
      setShowDialog(false)
      resetForm()
      fetchPopups()
    } catch (error) {
      console.error("[v0] Error saving popup:", error)
      toast({
        title: "Fehler",
        description: "Netzwerkfehler beim Speichern",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Sind Sie sicher, dass Sie dieses Popup löschen möchten?")) {
      return
    }

    try {
      const response = await fetch(`/api/popups/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: "Popup gelöscht",
        })
        fetchPopups()
      } else {
        toast({
          title: "Fehler",
          description: "Popup konnte nicht gelöscht werden",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error deleting popup:", error)
      toast({
        title: "Fehler",
        description: "Netzwerkfehler",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (popup: Popup) => {
    try {
      const response = await fetch(`/api/popups/${popup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...popup, is_active: !popup.is_active }),
        credentials: "include",
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: popup.is_active ? "Popup deaktiviert" : "Popup aktiviert",
        })
        fetchPopups()
      } else {
        toast({
          title: "Fehler",
          description: "Status konnte nicht geändert werden",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error toggling popup:", error)
      toast({
        title: "Fehler",
        description: "Netzwerkfehler",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (popup: Popup) => {
    setEditingPopup(popup)
    setFormData({
      title: popup.title,
      content: popup.content,
      button_text: popup.button_text || "",
      button_link: popup.button_link || "",
      image_url: popup.image_url || "",
      background_color: popup.background_color,
      text_color: popup.text_color,
      is_active: popup.is_active,
      display_frequency: popup.display_frequency,
      target_pages: popup.target_pages,
      start_date: popup.start_date || "",
      end_date: popup.end_date || "",
      display_order: popup.display_order,
    })
    setShowDialog(true)
  }

  const resetForm = () => {
    setEditingPopup(null)
    setFormData({
      title: "",
      content: "",
      button_text: "",
      button_link: "",
      image_url: "",
      background_color: "#ffffff",
      text_color: "#000000",
      is_active: true,
      display_frequency: "once",
      target_pages: [],
      start_date: "",
      end_date: "",
      display_order: 0,
    })
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("de-DE")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Popup Verwaltung
          </h2>
          <p className="text-muted-foreground">Erstellen und verwalten Sie Popups für die Landingpages</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchPopups} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setShowDialog(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Popup erstellen
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Popups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{popups.length}</div>
            <p className="text-xs text-muted-foreground">{popups.filter((p) => p.is_active).length} aktiv</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktive Popups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{popups.filter((p) => p.is_active).length}</div>
            <p className="text-xs text-muted-foreground">Derzeit sichtbar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inaktive Popups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{popups.filter((p) => !p.is_active).length}</div>
            <p className="text-xs text-muted-foreground">Nicht sichtbar</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Popups</CardTitle>
          <CardDescription>Verwalten Sie Ihre Landingpage Popups</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Lade Popups...</p>
            </div>
          ) : popups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Popups vorhanden</p>
              <p className="text-sm">Erstellen Sie Ihr erstes Popup</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Inhalt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Häufigkeit</TableHead>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead>Reihenfolge</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popups.map((popup) => (
                  <TableRow key={popup.id}>
                    <TableCell className="font-medium">{popup.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{popup.content}</TableCell>
                    <TableCell>
                      <Badge variant={popup.is_active ? "default" : "secondary"}>
                        {popup.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {popup.display_frequency === "once"
                          ? "Einmal"
                          : popup.display_frequency === "daily"
                            ? "Täglich"
                            : popup.display_frequency === "always"
                              ? "Immer"
                              : popup.display_frequency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {popup.start_date && popup.end_date
                        ? `${formatDate(popup.start_date)} - ${formatDate(popup.end_date)}`
                        : popup.start_date
                          ? `Ab ${formatDate(popup.start_date)}`
                          : popup.end_date
                            ? `Bis ${formatDate(popup.end_date)}`
                            : "Unbegrenzt"}
                    </TableCell>
                    <TableCell>{popup.display_order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleToggleActive(popup)}
                          title={popup.is_active ? "Deaktivieren" : "Aktivieren"}
                        >
                          {popup.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(popup)}
                          title="Bearbeiten"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(popup.id)}
                          title="Löschen"
                        >
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPopup ? "Popup bearbeiten" : "Neues Popup erstellen"}</DialogTitle>
            <DialogDescription>Konfigurieren Sie das Popup für Ihre Landingpages</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Popup Titel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Inhalt *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Popup Inhalt"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="button_text">Button Text</Label>
                <Input
                  id="button_text"
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  placeholder="z.B. Mehr erfahren"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="button_link">Button Link</Label>
                <Input
                  id="button_link"
                  value={formData.button_link}
                  onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Bild URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ColorPicker
                value={formData.background_color}
                onChange={(color) => setFormData({ ...formData, background_color: color })}
                label="Hintergrundfarbe"
                id="background_color"
              />
              <ColorPicker
                value={formData.text_color}
                onChange={(color) => setFormData({ ...formData, text_color: color })}
                label="Textfarbe"
                id="text_color"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_frequency">Anzeigehäufigkeit</Label>
              <Select
                value={formData.display_frequency}
                onValueChange={(value) => setFormData({ ...formData, display_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Einmal pro Benutzer</SelectItem>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="always">Immer anzeigen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Startdatum</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Enddatum</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Anzeigereihenfolge</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: Number.parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Aktiv</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false)
                resetForm()
              }}
            >
              Abbrechen
            </Button>
            <Button onClick={handleCreateOrUpdate}>{editingPopup ? "Aktualisieren" : "Erstellen"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PopupManager

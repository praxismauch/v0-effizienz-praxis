"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Monitor, MapPin, Plus, Edit, Trash2, GripVertical, FileText, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AppLayout } from "@/components/app-layout"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SimpleRichTextEditor } from "@/components/arbeitsplaetze/simple-rich-text-editor"
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
import { cn } from "@/lib/utils"
import { getColorConfig, ARBEITSPLATZ_COLORS, type ArbeitsplatzColor } from "@/components/arbeitsplaetze/arbeitsplatz-card"

interface Room {
  id: string
  name: string
  color?: string | null
}

interface Arbeitsplatz {
  id: string
  name: string
  beschreibung: string | null
  raum_id: string | null
  is_active: boolean
  room?: Room | null
  image_url?: string | null
  color?: ArbeitsplatzColor | null
  use_room_color?: boolean | null
}

interface Anweisung {
  id: string
  arbeitsplatz_id: string
  title: string
  content: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function ArbeitsplatzDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()
  const { toast } = useToast()
  const practiceId = currentPractice?.id || currentUser?.practice_id

  const [arbeitsplatz, setArbeitsplatz] = useState<Arbeitsplatz | null>(null)
  const [anweisungen, setAnweisungen] = useState<Anweisung[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAnweisung, setSelectedAnweisung] = useState<Anweisung | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    content: "",
  })

  useEffect(() => {
    if (practiceId) {
      fetchArbeitsplatz()
      fetchAnweisungen()
    }
  }, [practiceId, resolvedParams.id])

  const fetchArbeitsplatz = async () => {
    try {
      const response = await fetch(`/api/practices/${practiceId}/arbeitsplaetze/${resolvedParams.id}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setArbeitsplatz(data)
    } catch (error) {
      console.error("Error fetching Arbeitsplatz:", error)
      toast({
        title: "Fehler",
        description: "Arbeitsplatz konnte nicht geladen werden",
        variant: "destructive",
      })
    }
  }

  const fetchAnweisungen = async () => {
    try {
      const response = await fetch(`/api/practices/${practiceId}/arbeitsplaetze/${resolvedParams.id}/anweisungen`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setAnweisungen(data.anweisungen || [])
    } catch (error) {
      console.error("Error fetching Anweisungen:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnweisung = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Titel ein",
        variant: "destructive",
      })
      return
    }

    if (!practiceId) {
      toast({
        title: "Fehler",
        description: "Keine Praxis ausgewählt",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      console.log("[v0] Creating anweisung with:", {
        practiceId,
        arbeitsplatzId: resolvedParams.id,
        title: formData.title,
        content: formData.content,
      })

      const response = await fetch(`/api/practices/${practiceId}/arbeitsplaetze/${resolvedParams.id}/anweisungen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          sort_order: anweisungen.length,
        }),
      })

      const result = await response.json()
      console.log("[v0] Create anweisung response:", response.status, result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to create")
      }

      toast({
        title: "Erfolg",
        description: "Anweisung wurde erstellt",
      })

      setCreateDialogOpen(false)
      setFormData({ title: "", content: "" })
      fetchAnweisungen()
    } catch (error: any) {
      console.error("[v0] Error creating anweisung:", error)
      toast({
        title: "Fehler",
        description: error.message || "Anweisung konnte nicht erstellt werden",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditAnweisung = async () => {
    if (!selectedAnweisung || !formData.title.trim()) return

    setSaving(true)
    try {
      const response = await fetch(
        `/api/practices/${practiceId}/arbeitsplaetze/${resolvedParams.id}/anweisungen/${selectedAnweisung.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
          }),
        },
      )

      if (!response.ok) throw new Error("Failed to update")

      toast({
        title: "Erfolg",
        description: "Anweisung wurde aktualisiert",
      })

      setEditDialogOpen(false)
      setSelectedAnweisung(null)
      setFormData({ title: "", content: "" })
      fetchAnweisungen()
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Anweisung konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAnweisung = async () => {
    if (!selectedAnweisung) return

    setSaving(true)
    try {
      const response = await fetch(
        `/api/practices/${practiceId}/arbeitsplaetze/${resolvedParams.id}/anweisungen/${selectedAnweisung.id}`,
        {
          method: "DELETE",
        },
      )

      if (!response.ok) throw new Error("Failed to delete")

      toast({
        title: "Erfolg",
        description: "Anweisung wurde gelöscht",
      })

      setDeleteDialogOpen(false)
      setSelectedAnweisung(null)
      fetchAnweisungen()
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Anweisung konnte nicht gelöscht werden",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const openEditDialog = (anweisung: Anweisung) => {
    setSelectedAnweisung(anweisung)
    setFormData({
      title: anweisung.title,
      content: anweisung.content,
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (anweisung: Anweisung) => {
    setSelectedAnweisung(anweisung)
    setDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!arbeitsplatz) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Arbeitsplatz nicht gefunden</h3>
              <p className="text-muted-foreground text-center mb-6">
                Der angeforderte Arbeitsplatz existiert nicht oder wurde gelöscht.
              </p>
              <Button onClick={() => router.push("/arbeitsplaetze")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zur Übersicht
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  // Determine the effective color for this Arbeitsplatz
  let effectiveColor = arbeitsplatz.color
  if ((arbeitsplatz.use_room_color !== false) && arbeitsplatz.room?.color) {
    effectiveColor = arbeitsplatz.room.color as ArbeitsplatzColor
  }
  const colorConfig = getColorConfig(effectiveColor)

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/arbeitsplaetze")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-3 rounded-xl",
                  arbeitsplatz.is_active ? colorConfig.bg : "bg-gray-100 dark:bg-gray-800",
                )}
                style={arbeitsplatz.is_active && colorConfig.hex ? { backgroundColor: `${colorConfig.hex}20` } : undefined}
              >
                <Monitor
                  className={cn(
                    "h-6 w-6",
                    arbeitsplatz.is_active ? colorConfig.icon : "text-gray-500",
                  )}
                  style={arbeitsplatz.is_active && colorConfig.hex ? { color: colorConfig.hex } : undefined}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{arbeitsplatz.name}</h1>
                  <Badge variant={arbeitsplatz.is_active ? "success" : "secondary"}>
                    {arbeitsplatz.is_active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </div>
                {arbeitsplatz.room && (
                  <div className="flex items-center text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {arbeitsplatz.room.name}
                  </div>
                )}
                {arbeitsplatz.beschreibung && (
                  <p className="text-muted-foreground mt-2 max-w-2xl">{arbeitsplatz.beschreibung}</p>
                )}
              </div>
            </div>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Anweisung hinzufügen
          </Button>
        </div>

        {/* Anweisungen List */}
        {anweisungen.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Anweisungen ({anweisungen.length})</h2>
            <div className="space-y-3">
              {anweisungen
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((anweisung, index) => (
                  <Card key={anweisung.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GripVertical className="h-5 w-5 cursor-grab" />
                          <span className="text-sm font-medium">{index + 1}.</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground">{anweisung.title}</h3>
                          {anweisung.content && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{anweisung.content}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(anweisung)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                            onClick={() => openDeleteDialog(anweisung)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-full bg-muted mb-4">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Keine Anweisungen vorhanden</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Erstellen Sie Anweisungen für diesen Arbeitsplatz, um wichtige Informationen und Abläufe zu
                dokumentieren.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Erste Anweisung erstellen
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anweisung erstellen</DialogTitle>
            <DialogDescription>Erstellen Sie eine neue Anweisung für diesen Arbeitsplatz.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="z.B. Hygienemaßnahmen"
              />
            </div>
            <div>
              <Label htmlFor="content">Inhalt</Label>
              <SimpleRichTextEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Beschreiben Sie die Anweisung..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateAnweisung} disabled={saving}>
              {saving ? "Erstellt..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anweisung bearbeiten</DialogTitle>
            <DialogDescription>Bearbeiten Sie die Anweisung.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Titel *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Inhalt</Label>
              <SimpleRichTextEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Beschreiben Sie die Anweisung..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEditAnweisung} disabled={saving}>
              {saving ? "Speichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anweisung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Anweisung "{selectedAnweisung?.title}" wirklich löschen? Diese Aktion kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAnweisung}
              className="bg-red-600 hover:bg-red-700"
              disabled={saving}
            >
              {saving ? "Löscht..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}

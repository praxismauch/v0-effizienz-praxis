"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Plus, Search, DoorOpen, Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/app-layout"

interface Room {
  id: string
  name: string
  beschreibung?: string
  practice_id: string
  created_at: string
  updated_at?: string
}

const ROOM_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  anmeldung: { bg: "bg-blue-50", border: "border-l-4 border-l-blue-500", icon: "text-blue-600" },
  empfang: { bg: "bg-blue-50", border: "border-l-4 border-l-blue-500", icon: "text-blue-600" },
  arzt: { bg: "bg-emerald-50", border: "border-l-4 border-l-emerald-500", icon: "text-emerald-600" },
  behandlung: { bg: "bg-emerald-50", border: "border-l-4 border-l-emerald-500", icon: "text-emerald-600" },
  untersuchung: { bg: "bg-teal-50", border: "border-l-4 border-l-teal-500", icon: "text-teal-600" },
  ekg: { bg: "bg-rose-50", border: "border-l-4 border-l-rose-500", icon: "text-rose-600" },
  labor: { bg: "bg-purple-50", border: "border-l-4 border-l-purple-500", icon: "text-purple-600" },
  büro: { bg: "bg-amber-50", border: "border-l-4 border-l-amber-500", icon: "text-amber-600" },
  office: { bg: "bg-amber-50", border: "border-l-4 border-l-amber-500", icon: "text-amber-600" },
  küche: { bg: "bg-orange-50", border: "border-l-4 border-l-orange-500", icon: "text-orange-600" },
  pause: { bg: "bg-orange-50", border: "border-l-4 border-l-orange-500", icon: "text-orange-600" },
  sozial: { bg: "bg-orange-50", border: "border-l-4 border-l-orange-500", icon: "text-orange-600" },
  server: { bg: "bg-slate-100", border: "border-l-4 border-l-slate-500", icon: "text-slate-600" },
  technik: { bg: "bg-slate-100", border: "border-l-4 border-l-slate-500", icon: "text-slate-600" },
  lager: { bg: "bg-stone-50", border: "border-l-4 border-l-stone-500", icon: "text-stone-600" },
  archiv: { bg: "bg-stone-50", border: "border-l-4 border-l-stone-500", icon: "text-stone-600" },
  warte: { bg: "bg-sky-50", border: "border-l-4 border-l-sky-500", icon: "text-sky-600" },
  warteraum: { bg: "bg-sky-50", border: "border-l-4 border-l-sky-500", icon: "text-sky-600" },
  röntgen: { bg: "bg-indigo-50", border: "border-l-4 border-l-indigo-500", icon: "text-indigo-600" },
  ultraschall: { bg: "bg-violet-50", border: "border-l-4 border-l-violet-500", icon: "text-violet-600" },
  sono: { bg: "bg-violet-50", border: "border-l-4 border-l-violet-500", icon: "text-violet-600" },
  op: { bg: "bg-red-50", border: "border-l-4 border-l-red-500", icon: "text-red-600" },
  eingriff: { bg: "bg-red-50", border: "border-l-4 border-l-red-500", icon: "text-red-600" },
  physio: { bg: "bg-lime-50", border: "border-l-4 border-l-lime-500", icon: "text-lime-600" },
  therapie: { bg: "bg-lime-50", border: "border-l-4 border-l-lime-500", icon: "text-lime-600" },
  wc: { bg: "bg-gray-50", border: "border-l-4 border-l-gray-400", icon: "text-gray-500" },
  toilette: { bg: "bg-gray-50", border: "border-l-4 border-l-gray-400", icon: "text-gray-500" },
}

// Fallback colors for rooms that don't match any pattern
const FALLBACK_COLORS = [
  { bg: "bg-cyan-50", border: "border-l-4 border-l-cyan-500", icon: "text-cyan-600" },
  { bg: "bg-pink-50", border: "border-l-4 border-l-pink-500", icon: "text-pink-600" },
  { bg: "bg-fuchsia-50", border: "border-l-4 border-l-fuchsia-500", icon: "text-fuchsia-600" },
  { bg: "bg-emerald-50", border: "border-l-4 border-l-emerald-500", icon: "text-emerald-600" },
]

function getRoomColor(roomName: string, index: number) {
  const nameLower = roomName.toLowerCase()

  // Check for matching keywords
  for (const [keyword, colors] of Object.entries(ROOM_COLORS)) {
    if (nameLower.includes(keyword)) {
      return colors
    }
  }

  // Use fallback color based on index for consistent coloring
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

type PageClientProps = {}

export default function PageClient(_props: PageClientProps) {
  const { currentUser: user, loading: authLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  // Data state - using useState with functional updates
  const [rooms, setRooms] = useState<Room[]>([])

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form states
  const [formName, setFormName] = useState("")
  const [formBeschreibung, setFormBeschreibung] = useState("")

  // Fetch rooms function
  const fetchRooms = useCallback(async () => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/rooms`)
      if (response.ok) {
        const data = await response.json()
        setRooms(() => data || [])
      }
    } catch (error) {
      console.error("Error fetching rooms:", error)
      toast.error("Fehler beim Laden der Räume")
    }
  }, [currentPractice?.id])

  // Initial load
  useEffect(() => {
    if (currentPractice?.id && !practiceLoading) {
      setLoading(true)
      fetchRooms().finally(() => setLoading(false))
    }
  }, [fetchRooms, currentPractice?.id, practiceLoading])

  const handleCreate = async () => {
    if (!currentPractice?.id || !formName.trim()) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          beschreibung: formBeschreibung.trim() || null,
        }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        if (text.includes("Too Many") || response.status === 429) {
          toast.error("Zu viele Anfragen. Bitte warten Sie einen Moment.")
          return
        }
        toast.error("Fehler beim Erstellen des Raums")
        return
      }

      if (response.ok) {
        const newRoom = await response.json()
        // Instant update using functional state
        setRooms(prev => [...prev, newRoom].sort((a, b) => a.name.localeCompare(b.name)))
        setIsCreateOpen(false)
        resetForm()
        toast.success("Raum erfolgreich erstellt")
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error.error || "Fehler beim Erstellen des Raums")
      }
    } catch (error) {
      console.error("Error creating room:", error)
      toast.error("Fehler beim Erstellen des Raums")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!currentPractice?.id || !selectedRoom || !formName.trim()) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/rooms/${selectedRoom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          beschreibung: formBeschreibung.trim() || null,
        }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        if (text.includes("Too Many") || response.status === 429) {
          toast.error("Zu viele Anfragen. Bitte warten Sie einen Moment.")
          return
        }
        toast.error("Fehler beim Aktualisieren des Raums")
        return
      }

      if (response.ok) {
        const updatedRoom = await response.json()
        // Instant update using functional state
        setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r).sort((a, b) => a.name.localeCompare(b.name)))
        setIsEditOpen(false)
        resetForm()
        setSelectedRoom(null)
        toast.success("Raum erfolgreich aktualisiert")
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error.error || "Fehler beim Aktualisieren des Raums")
      }
    } catch (error) {
      console.error("Error updating room:", error)
      toast.error("Fehler beim Aktualisieren des Raums")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!currentPractice?.id || !selectedRoom) return

    const roomId = selectedRoom.id
    setIsDeleteOpen(false)
    setSelectedRoom(null)

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/rooms/${roomId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Instant update using functional state
        setRooms(prev => prev.filter(r => r.id !== roomId))
        toast.success("Raum erfolgreich gelöscht")
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error.error || "Fehler beim Löschen des Raums")
      }
    } catch (error) {
      console.error("Error deleting room:", error)
      toast.error("Fehler beim Löschen des Raums")
    }
  }

  const openEditDialog = (room: Room) => {
    setSelectedRoom(room)
    setFormName(room.name)
    setFormBeschreibung(room.beschreibung || "")
    setIsEditOpen(true)
  }

  const openDeleteDialog = (room: Room) => {
    setSelectedRoom(room)
    setIsDeleteOpen(true)
  }

  const resetForm = () => {
    setFormName("")
    setFormBeschreibung("")
  }

  const filteredRooms = rooms.filter(
    (room) =>
      room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.beschreibung?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (authLoading || practiceLoading) {
    return (
      <AppLayout loading={true} loadingMessage="Lade Räume...">
        <div />
      </AppLayout>
    )
  }

  if (!user || !currentPractice) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Anmeldung erforderlich</CardTitle>
              <CardDescription>Bitte melden Sie sich an, um die Räume zu verwalten.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Räume</h1>
            <p className="text-muted-foreground">Verwalten Sie Ihre Praxisräume</p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setIsCreateOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Neuer Raum
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5" />
              Raumübersicht ({filteredRooms.length})
            </CardTitle>
            <CardDescription>Alle Räume in Ihrer Praxis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Räume durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRooms.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRooms.map((room, index) => {
                  const colors = getRoomColor(room.name, index)
                  return (
                    <Card
                      key={room.id}
                      className={`group relative transition-all hover:shadow-md ${colors.bg} ${colors.border}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <DoorOpen className={`h-5 w-5 ${colors.icon}`} />
                            <CardTitle className="text-lg">{room.name}</CardTitle>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(room)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => openDeleteDialog(room)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {room.beschreibung ? (
                          <p className="text-sm text-muted-foreground line-clamp-2">{room.beschreibung}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground/70 italic">Keine Beschreibung</p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <DoorOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery ? "Keine Räume gefunden" : "Noch keine Räume erstellt"}
                </p>
                {!searchQuery && (
                  <Button
                    variant="outline"
                    className="mt-4 bg-transparent"
                    onClick={() => {
                      resetForm()
                      setIsCreateOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ersten Raum erstellen
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuer Raum</DialogTitle>
              <DialogDescription>Erstellen Sie einen neuen Praxisraum</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="z.B. Behandlungsraum 1"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beschreibung">Beschreibung</Label>
                <Textarea
                  id="beschreibung"
                  placeholder="Optionale Beschreibung des Raums..."
                  value={formBeschreibung}
                  onChange={(e) => setFormBeschreibung(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreate} disabled={isSaving || !formName.trim()}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Raum bearbeiten</DialogTitle>
              <DialogDescription>Ändern Sie die Raumdaten</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="z.B. Behandlungsraum 1"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-beschreibung">Beschreibung</Label>
                <Textarea
                  id="edit-beschreibung"
                  placeholder="Optionale Beschreibung des Raums..."
                  value={formBeschreibung}
                  onChange={(e) => setFormBeschreibung(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleEdit} disabled={isSaving || !formName.trim()}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Raum löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie den Raum &quot;{selectedRoom?.name}&quot; wirklich löschen? Diese Aktion kann nicht
                rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  )
}

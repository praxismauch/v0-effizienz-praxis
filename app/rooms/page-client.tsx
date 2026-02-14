"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Plus, Search, DoorOpen, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/app-layout"
import { RoomCard } from "./components/room-card"
import { RoomFormDialog } from "./components/room-form-dialog"
import type { Room, Device } from "./room-utils"

export default function PageClient() {
  const { currentUser: user, loading: authLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  const [rooms, setRooms] = useState<Room[]>([])
  const [roomDevices, setRoomDevices] = useState<Record<string, Device[]>>({})

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form states
  const [formName, setFormName] = useState("")
  const [formBeschreibung, setFormBeschreibung] = useState("")
  const [formColor, setFormColor] = useState("#3b82f6")
  const [formImages, setFormImages] = useState<string[]>([])

  const uploadEndpoint = currentPractice?.id
    ? `/api/practices/${currentPractice.id}/rooms/upload-image`
    : ""

  const fetchDevicesForRoom = useCallback(async (roomId: string) => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/rooms/${roomId}/devices`)
      if (response.ok) {
        const data = await response.json()
        setRoomDevices(prev => ({ ...prev, [roomId]: data.devices || [] }))
      }
    } catch (error) {
      console.error("Error fetching devices for room:", error)
    }
  }, [currentPractice?.id])

  const fetchRooms = useCallback(async () => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/rooms`)
      if (response.ok) {
        const data = await response.json()
        const roomsData = data || []
        setRooms(() => roomsData)
        roomsData.forEach((room: Room) => fetchDevicesForRoom(room.id))
      }
    } catch (error) {
      console.error("Error fetching rooms:", error)
      toast.error("Fehler beim Laden der Räume")
    }
  }, [currentPractice?.id, fetchDevicesForRoom])

  useEffect(() => {
    if (currentPractice?.id && !practiceLoading) {
      setLoading(true)
      fetchRooms().finally(() => setLoading(false))
    }
  }, [fetchRooms, currentPractice?.id, practiceLoading])

  const handleSaveRoom = async (method: "POST" | "PATCH") => {
    if (!currentPractice?.id || !formName.trim()) return
    const isEdit = method === "PATCH"
    if (isEdit && !selectedRoom) return

    setIsSaving(true)
    try {
      const url = isEdit
        ? `/api/practices/${currentPractice.id}/rooms/${selectedRoom!.id}`
        : `/api/practices/${currentPractice.id}/rooms`

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          beschreibung: formBeschreibung.trim() || null,
          color: formColor,
          images: formImages.length > 0 ? formImages : null,
        }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        if (text.includes("Too Many") || response.status === 429) {
          toast.error("Zu viele Anfragen. Bitte warten Sie einen Moment.")
          return
        }
        toast.error(isEdit ? "Fehler beim Aktualisieren des Raums" : "Fehler beim Erstellen des Raums")
        return
      }

      if (response.ok) {
        const roomData = await response.json()
        if (isEdit) {
          setRooms(prev => prev.map(r => r.id === roomData.id ? roomData : r).sort((a, b) => a.name.localeCompare(b.name)))
          setIsEditOpen(false)
          toast.success("Raum erfolgreich aktualisiert")
        } else {
          setRooms(prev => [...prev, roomData].sort((a, b) => a.name.localeCompare(b.name)))
          setIsCreateOpen(false)
          toast.success("Raum erfolgreich erstellt")
        }
        resetForm()
        setSelectedRoom(null)
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error.error || (isEdit ? "Fehler beim Aktualisieren des Raums" : "Fehler beim Erstellen des Raums"))
      }
    } catch (error) {
      console.error("Error saving room:", error)
      toast.error("Fehler beim Speichern des Raums")
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
    setFormColor(room.color || "#3b82f6")
    setFormImages(room.images || [])
    setIsEditOpen(true)
  }

  const openDeleteDialog = (room: Room) => {
    setSelectedRoom(room)
    setIsDeleteOpen(true)
  }

  const resetForm = () => {
    setFormName("")
    setFormBeschreibung("")
    setFormColor("#3b82f6")
    setFormImages([])
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
          <Button onClick={() => { resetForm(); setIsCreateOpen(true) }}>
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
                {filteredRooms.map((room, index) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    index={index}
                    devices={roomDevices[room.id] || []}
                    onEdit={openEditDialog}
                    onDelete={openDeleteDialog}
                  />
                ))}
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
                    onClick={() => { resetForm(); setIsCreateOpen(true) }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ersten Raum erstellen
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <RoomFormDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title="Neuer Raum"
          description="Erstellen Sie einen neuen Praxisraum"
          formName={formName}
          onFormNameChange={setFormName}
          formBeschreibung={formBeschreibung}
          onFormBeschreibungChange={setFormBeschreibung}
          formColor={formColor}
          onFormColorChange={setFormColor}
          formImages={formImages}
          onFormImagesChange={setFormImages}
          uploadEndpoint={uploadEndpoint}
          isSaving={isSaving}
          onSave={() => handleSaveRoom("POST")}
          saveLabel="Erstellen"
        />

        <RoomFormDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Raum bearbeiten"
          description="Ändern Sie die Raumdaten"
          formName={formName}
          onFormNameChange={setFormName}
          formBeschreibung={formBeschreibung}
          onFormBeschreibungChange={setFormBeschreibung}
          formColor={formColor}
          onFormColorChange={setFormColor}
          formImages={formImages}
          onFormImagesChange={setFormImages}
          uploadEndpoint={uploadEndpoint}
          isSaving={isSaving}
          onSave={() => handleSaveRoom("PATCH")}
          saveLabel="Speichern"
        />

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

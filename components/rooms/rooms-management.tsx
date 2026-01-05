"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Plus, Pencil, Trash2 } from "lucide-react"
import { CreateRoomDialog } from "./create-room-dialog"
import { EditRoomDialog } from "./edit-room-dialog"
import { toast } from "sonner"

interface Room {
  id: string
  name: string
  beschreibung: string | null
  created_at: string
}

interface RoomsManagementProps {
  initialRooms: Room[] | null
  practiceId: string
}

export function RoomsManagement({ initialRooms, practiceId }: RoomsManagementProps) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms ?? [])
  const [createOpen, setCreateOpen] = useState(false)
  const [editRoom, setEditRoom] = useState<Room | null>(null)

  const handleOpenCreate = () => {
    if (!practiceId) {
      toast.error("Fehler", { description: "Keine Praxis ausgewählt. Bitte laden Sie die Seite neu." })
      return
    }
    setCreateOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diesen Raum wirklich löschen?")) return

    const res = await fetch(`/api/rooms/${id}`, {
      method: "DELETE",
    })

    if (res.ok) {
      setRooms(rooms.filter((r) => r.id !== id))
      toast.success("Erfolg", { description: "Raum wurde gelöscht" })
    } else {
      toast.error("Fehler", { description: "Raum konnte nicht gelöscht werden" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Räume</h1>
          <p className="text-muted-foreground mt-1">Verwalten Sie die Räume Ihrer Praxis</p>
        </div>
        <Button onClick={handleOpenCreate} disabled={!practiceId}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Raum
        </Button>
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Noch keine Räume vorhanden. Erstellen Sie Ihren ersten Raum.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditRoom(room)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(room.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {room.beschreibung && <CardDescription className="mt-2">{room.beschreibung}</CardDescription>}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {practiceId && (
        <CreateRoomDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          practiceId={practiceId}
          onSuccess={(newRoom) => {
            setRooms([...rooms, newRoom])
            setCreateOpen(false)
          }}
        />
      )}

      {editRoom && (
        <EditRoomDialog
          open={!!editRoom}
          onOpenChange={(open) => !open && setEditRoom(null)}
          room={editRoom}
          onSuccess={(updatedRoom) => {
            setRooms(rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)))
            setEditRoom(null)
          }}
        />
      )}
    </div>
  )
}

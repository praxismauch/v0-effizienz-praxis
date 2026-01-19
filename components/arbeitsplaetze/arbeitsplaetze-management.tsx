"use client"

import { useEffect, useState } from "react"
import { Plus, Monitor, MapPin, CheckCircle2, Search, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import CreateArbeitsplatzDialog from "./create-arbeitsplatz-dialog"
import EditArbeitsplatzDialog from "./edit-arbeitsplatz-dialog"
import { ArbeitsplatzCard } from "./arbeitsplatz-card"
import { cn } from "@/lib/utils"
import { useUser } from "@/contexts/user-context"
import { useArbeitsplaetze } from "@/hooks/use-arbeitsplaetze"

interface Room {
  id: string
  name: string
}

interface Arbeitsplatz {
  id: string
  name: string
  beschreibung: string | null
  raum_id: string | null
  is_active: boolean
  room?: Room | null
}

function ArbeitsplaetzeManagement() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedArbeitsplatz, setSelectedArbeitsplatz] = useState<Arbeitsplatz | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const { currentUser } = useUser()

  const practiceId = currentUser?.practiceId

  const { arbeitsplaetze, isLoading: loading, mutate } = useArbeitsplaetze(practiceId)

  const handleEdit = (arbeitsplatz: Arbeitsplatz) => {
    setSelectedArbeitsplatz(arbeitsplatz)
    setEditOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diesen Arbeitsplatz wirklich löschen?")) return

    try {
      const response = await fetch(`/api/practices/${practiceId}/arbeitsplaetze/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete")

      mutate()
    } catch (error) {
      console.error("Error deleting Arbeitsplatz:", error)
    }
  }

  const handleToggleActive = async (id: string, newStatus: boolean) => {
    try {
      const response = await fetch(`/api/practices/${practiceId}/arbeitsplaetze/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to toggle status")

      mutate()
    } catch (error) {
      console.error("Error toggling Arbeitsplatz status:", error)
    }
  }

  const filteredArbeitsplaetze = arbeitsplaetze.filter(
    (ap) =>
      ap.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ap.beschreibung?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ap.room?.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const activeCount = arbeitsplaetze.filter((ap) => ap.is_active).length
  const inactiveCount = arbeitsplaetze.filter((ap) => !ap.is_active).length
  const withRoomCount = arbeitsplaetze.filter((ap) => ap.room).length

  if (loading) {
    return null
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Arbeitsplätze</h1>
          <p className="text-muted-foreground">Verwalten Sie die Arbeitsplätze und deren Anweisungen</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Arbeitsplatz hinzufügen
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted">
                <Monitor className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesamt</p>
                <p className="text-2xl font-bold">{arbeitsplaetze.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted">
                <CheckCircle2 className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktiv</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted">
                <MapPin className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mit Raum</p>
                <p className="text-2xl font-bold">{withRoomCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      {arbeitsplaetze.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ansicht:</span>
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={cn("rounded-none h-8 px-3", viewMode === "grid" && "bg-muted")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={cn("rounded-none h-8 px-3", viewMode === "list" && "bg-muted")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {filteredArbeitsplaetze.length > 0 ? (
        <div className={cn(viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-3")}>
          {filteredArbeitsplaetze.map((arbeitsplatz) => (
            <ArbeitsplatzCard
              key={arbeitsplatz.id}
              arbeitsplatz={arbeitsplatz}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : arbeitsplaetze.length === 0 ? (
        /* Empty State */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Monitor className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Keine Arbeitsplätze vorhanden</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Erstellen Sie Arbeitsplätze, um Anweisungen und Informationen für verschiedene Stationen in Ihrer Praxis
              zu verwalten.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ersten Arbeitsplatz erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* No Search Results */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Ergebnisse</h3>
            <p className="text-muted-foreground text-center">Keine Arbeitsplätze gefunden für "{searchQuery}"</p>
            <Button variant="ghost" className="mt-4" onClick={() => setSearchQuery("")}>
              Suche zurücksetzen
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateArbeitsplatzDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={fetchArbeitsplaetze} />

      {selectedArbeitsplatz && (
        <EditArbeitsplatzDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          arbeitsplatz={selectedArbeitsplatz}
          onSuccess={fetchArbeitsplaetze}
        />
      )}
    </div>
  )
}

export default ArbeitsplaetzeManagement

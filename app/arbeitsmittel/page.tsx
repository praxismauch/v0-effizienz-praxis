"use client"

import { AppLayout } from "@/components/app-layout"
import { useState, useMemo } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, AlertCircle } from "lucide-react"
import CreateArbeitsmittelDialog from "@/components/arbeitsmittel/create-arbeitsmittel-dialog"
import EditArbeitsmittelDialog from "@/components/arbeitsmittel/edit-arbeitsmittel-dialog"
import { useAuth } from "@/contexts/auth-context"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
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
import { SWR_KEYS } from "@/lib/swr-keys"
import { ArbeitsmittelStats } from "./components/arbeitsmittel-stats"
import { ArbeitsmittelTable } from "./components/arbeitsmittel-table"

export default function ArbeitsmittelPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { toast } = useToast()

  const {
    data: arbeitsmittel,
    error: arbeitsmittelError,
    isLoading: arbeitsmittelLoading,
    mutate: mutateArbeitsmittel,
  } = useSWR(currentPractice?.id ? SWR_KEYS.arbeitsmittel(currentPractice.id) : null, async (url) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error("Failed to fetch arbeitsmittel")
    return response.json()
  })

  const {
    data: teamMembers,
    error: teamMembersError,
    isLoading: teamMembersLoading,
  } = useSWR(currentPractice?.id ? SWR_KEYS.teamMembers(currentPractice.id) : null, async (url) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error("Failed to fetch team members")
    const data = await response.json()
    const members = data?.teamMembers || data
    return Array.isArray(members) ? members : []
  })

  const filteredItems = useMemo(() => {
    if (!arbeitsmittel) return []
    return arbeitsmittel.filter(
      (item: any) =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [arbeitsmittel, searchQuery])

  const stats = useMemo(() => {
    if (!arbeitsmittel) return { total: 0, available: 0, assigned: 0, maintenance: 0 }
    return {
      total: arbeitsmittel.length,
      available: arbeitsmittel.filter((i: any) => i.status === "available").length,
      assigned: arbeitsmittel.filter((i: any) => i.status === "assigned").length,
      maintenance: arbeitsmittel.filter((i: any) => i.status === "maintenance").length,
    }
  }, [arbeitsmittel])

  const loading = arbeitsmittelLoading || teamMembersLoading
  const error = arbeitsmittelError || teamMembersError
  const isInitializing = (authLoading || practiceLoading) && !currentPractice?.id

  if (!user && !authLoading) return null

  if (!currentPractice?.id && !practiceLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Arbeitsmittel</h1>
            <p className="text-muted-foreground">Verwalten Sie Arbeitsmittel und deren Zuweisungen</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} disabled={isInitializing}>
            <Plus className="mr-2 h-4 w-4" />
            Arbeitsmittel hinzufügen
          </Button>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Bitte wählen Sie eine Praxis aus, um Arbeitsmittel zu verwalten.
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete || !currentPractice?.id) return
    try {
      await mutateArbeitsmittel((current) => current?.filter((item: any) => item.id !== itemToDelete), { revalidate: false })
      const response = await fetch(`/api/practices/${currentPractice.id}/arbeitsmittel/${itemToDelete}`, { method: "DELETE" })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to delete")
      }
      toast({ title: "Gelöscht", description: "Arbeitsmittel wurde erfolgreich gelöscht." })
      await mutateArbeitsmittel()
    } catch (err: any) {
      await mutateArbeitsmittel()
      toast({ title: "Fehler", description: err?.message || "Fehler beim Löschen des Arbeitsmittels", variant: "destructive" })
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Arbeitsmittel</h1>
          <p className="text-muted-foreground">Verwalten Sie Arbeitsmittel und deren Zuweisungen</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} disabled={isInitializing}>
          <Plus className="mr-2 h-4 w-4" />
          Arbeitsmittel hinzufügen
        </Button>
      </div>

      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>{error?.message || "Fehler beim Laden der Daten"}</AlertDescription>
          </Alert>
        )}

        {isInitializing || loading ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-10 w-64" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <ArbeitsmittelStats stats={stats} />
            <ArbeitsmittelTable
              items={filteredItems}
              teamMembers={teamMembers || []}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onEdit={(item) => { setSelectedItem(item); setEditDialogOpen(true) }}
              onDelete={(id) => { setItemToDelete(id); setDeleteDialogOpen(true) }}
            />
          </>
        )}

        <CreateArbeitsmittelDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSuccess={() => mutateArbeitsmittel()} teamMembers={teamMembers || []} />
        {selectedItem && <EditArbeitsmittelDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} onSuccess={() => mutateArbeitsmittel()} item={selectedItem} teamMembers={teamMembers || []} />}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Arbeitsmittel löschen?</AlertDialogTitle>
              <AlertDialogDescription>Möchten Sie dieses Arbeitsmittel wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Löschen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  )
}

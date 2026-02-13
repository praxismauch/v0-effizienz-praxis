"use client"

import { AppLayout } from "@/components/app-layout"
import { useState, useMemo } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Key,
  Laptop,
  Smartphone,
  ShirtIcon,
  Package,
  AlertCircle,
} from "lucide-react"
import CreateArbeitsmittelDialog from "@/components/arbeitsmittel/create-arbeitsmittel-dialog"
import EditArbeitsmittelDialog from "@/components/arbeitsmittel/edit-arbeitsmittel-dialog"
import { useRouter } from "next/navigation"
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

const typeIcons: Record<string, any> = {
  Schlüssel: Key,
  Dienstkleidung: ShirtIcon,
  "Dienst Handy": Smartphone,
  "Dienst Laptop": Laptop,
  Sonstiges: Package,
}

const statusColors: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  assigned: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  maintenance: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  retired: "bg-gray-500/10 text-gray-600 border-gray-500/20",
}

const statusLabels: Record<string, string> = {
  available: "Verfügbar",
  assigned: "Zugewiesen",
  maintenance: "Wartung",
  retired: "Ausgemustert",
}

export default function ArbeitsmittelPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const router = useRouter()
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
    // API returns { teamMembers: [...] } - extract the array
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

  if (!user && !authLoading) {
    return null // Will redirect to login
  }

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
      await mutateArbeitsmittel((current) => current?.filter((item: any) => item.id !== itemToDelete), {
        revalidate: false,
      })

      const response = await fetch(`/api/practices/${currentPractice.id}/arbeitsmittel/${itemToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete")
      }

      toast({
        title: "Gelöscht",
        description: "Arbeitsmittel wurde erfolgreich gelöscht.",
      })

      await mutateArbeitsmittel()
    } catch (error: any) {
      await mutateArbeitsmittel()
      toast({
        title: "Fehler",
        description: error?.message || "Fehler beim Löschen des Arbeitsmittels",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id)
    setDeleteDialogOpen(true)
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
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Verfügbar</CardTitle>
                  <Badge className="bg-emerald-500">{stats.available}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.available}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Zugewiesen</CardTitle>
                  <Badge className="bg-blue-500">{stats.assigned}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.assigned}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Wartung</CardTitle>
                  <Badge className="bg-amber-500">{stats.maintenance}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.maintenance}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Arbeitsmittel-Liste</CardTitle>
                    <CardDescription>Alle Arbeitsmittel Ihrer Praxis</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Suchen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-6 px-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px]">Typ</TableHead>
                        <TableHead className="min-w-[120px]">Name</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[140px]">Zugewiesen an</TableHead>
                        <TableHead className="text-right min-w-[80px]">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Keine Arbeitsmittel gefunden
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems.map((item) => {
                          const Icon = typeIcons[item.type] || Package
                          const assignedMember = item.assigned_to && Array.isArray(teamMembers)
                            ? teamMembers.find((m) => m.id === item.assigned_to || m.user_id === item.assigned_to)
                            : null
                          return (
                            <TableRow key={item.id} className="group">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="whitespace-nowrap">{item.type}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={statusColors[item.status]}>
                                  {statusLabels[item.status]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {assignedMember ? `${assignedMember.first_name} ${assignedMember.last_name}` : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => {
                                      setSelectedItem(item)
                                      setEditDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteClick(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <CreateArbeitsmittelDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={() => mutateArbeitsmittel()}
          teamMembers={teamMembers || []}
        />

        {selectedItem && (
          <EditArbeitsmittelDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={() => mutateArbeitsmittel()}
            item={selectedItem}
            teamMembers={teamMembers || []}
          />
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Arbeitsmittel löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie dieses Arbeitsmittel wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
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

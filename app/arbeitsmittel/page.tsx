"use client"

import { AppLayout } from "@/components/app-layout"
import { useState, useEffect, useRef, useCallback } from "react"
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
  RefreshCw,
} from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
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
  const [arbeitsmittel, setArbeitsmittel] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createBrowserClient()
  const { user, loading: authLoading } = useAuth()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { toast } = useToast()

  const loadedPracticeIdRef = useRef<string | null>(null)
  const isLoadingRef = useRef(false)

  const loadData = useCallback(
    async (practiceId: string) => {
      // Prevent concurrent loads
      if (isLoadingRef.current) {
        return
      }

      isLoadingRef.current = true
      setError(null)
      setLoading(true)

      try {
        const { data: items, error: itemsError } = await supabase
          .from("arbeitsmittel")
          .select("*")
          .eq("practice_id", practiceId)
          .order("created_at", { ascending: false })

        if (itemsError) {
          const errorMessage = itemsError.message || String(itemsError)
          if (
            errorMessage.includes("Too Many Requests") ||
            errorMessage.includes("rate limit") ||
            errorMessage.includes("429")
          ) {
            setError("Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.")
            setArbeitsmittel([])
            setLoading(false)
            isLoadingRef.current = false
            return
          } else {
            setError("Fehler beim Laden der Arbeitsmittel: " + errorMessage)
          }
        } else {
          setArbeitsmittel(items || [])
        }

        await new Promise((resolve) => setTimeout(resolve, 100))

        try {
          const { data: members, error: membersError } = await supabase
            .from("team_members")
            .select("id, first_name, last_name, role")
            .eq("practice_id", practiceId)
            .order("first_name")

          if (membersError) {
            const errorMessage = membersError.message || String(membersError)
            if (
              !errorMessage.includes("Too Many Requests") &&
              !errorMessage.includes("rate limit") &&
              !errorMessage.includes("429")
            ) {
              console.error("Error loading team members:", membersError.message)
            }
            setTeamMembers([])
          } else {
            setTeamMembers(members || [])
          }
        } catch (memberError: any) {
          const errorStr = String(memberError)
          if (errorStr.includes("Too Many") || errorStr.includes("Unexpected token")) {
            console.warn("Rate limited when fetching team members, using empty list")
          } else {
            console.error("Error loading team members:", memberError)
          }
          setTeamMembers([])
        }
      } catch (error: any) {
        const errorMessage = error?.message || String(error)
        if (
          errorMessage.includes("Too Many Requests") ||
          errorMessage.includes("rate limit") ||
          errorMessage.includes("429") ||
          errorMessage.includes("Unexpected token")
        ) {
          setError("Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.")
        } else {
          console.error("Error loading data:", error)
          setError("Ein unerwarteter Fehler ist aufgetreten.")
        }
      } finally {
        setLoading(false)
        isLoadingRef.current = false
      }
    },
    [supabase],
  )

  useEffect(() => {
    if (!user && !authLoading) {
      router.push("/auth/login")
      return
    }

    // Only load if we have a practice ID and haven't loaded this practice yet
    const practiceId = currentPractice?.id
    if (practiceId && loadedPracticeIdRef.current !== practiceId && !isLoadingRef.current) {
      loadedPracticeIdRef.current = practiceId
      loadData(practiceId)
    } else if (!practiceLoading && !practiceId) {
      setLoading(false)
    }
  }, [user, authLoading, currentPractice?.id, practiceLoading, loadData, router])

  const handleReload = useCallback(() => {
    if (currentPractice?.id) {
      loadedPracticeIdRef.current = null // Reset to allow reload
      loadData(currentPractice.id)
    }
  }, [currentPractice?.id, loadData])

  function handleDeleteClick(id: string) {
    setItemToDelete(id)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!itemToDelete) return

    try {
      const { error } = await supabase.from("arbeitsmittel").delete().eq("id", itemToDelete)

      if (error) throw error

      toast({
        title: "Gelöscht",
        description: "Arbeitsmittel wurde erfolgreich gelöscht.",
      })

      handleReload()
    } catch (error: any) {
      console.error("Error deleting arbeitsmittel:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen des Arbeitsmittels",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const filteredItems = arbeitsmittel.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const stats = {
    total: arbeitsmittel.length,
    available: arbeitsmittel.filter((i) => i.status === "available").length,
    assigned: arbeitsmittel.filter((i) => i.status === "assigned").length,
    maintenance: arbeitsmittel.filter((i) => i.status === "maintenance").length,
  }

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
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleReload} className="ml-4 bg-transparent">
                <RefreshCw className="mr-2 h-4 w-4" />
                Erneut versuchen
              </Button>
            </AlertDescription>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Arbeitsmittel-Liste</CardTitle>
                    <CardDescription>Alle Arbeitsmittel Ihrer Praxis</CardDescription>
                  </div>
                  <div className="relative w-64">
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Typ</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Seriennummer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Zugewiesen an</TableHead>
                      <TableHead>Zustand</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Keine Arbeitsmittel gefunden
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => {
                        const Icon = typeIcons[item.type] || Package
                        const assignedMember = item.assigned_to
                          ? teamMembers.find((m) => m.id === item.assigned_to)
                          : null
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span>{item.type}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.serial_number || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusColors[item.status]}>
                                {statusLabels[item.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {assignedMember ? `${assignedMember.first_name} ${assignedMember.last_name}` : "-"}
                            </TableCell>
                            <TableCell>{item.condition || "-"}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedItem(item)
                                      setEditDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Bearbeiten
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(item.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Löschen
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        <CreateArbeitsmittelDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleReload}
          teamMembers={teamMembers}
        />

        {selectedItem && (
          <EditArbeitsmittelDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={handleReload}
            item={selectedItem}
            teamMembers={teamMembers}
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

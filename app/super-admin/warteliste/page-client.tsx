"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Search, Mail, MoreVertical, CheckCircle2, XCircle, Clock, Download, Trash2 } from "lucide-react"
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { de } from "date-fns/locale"

interface WaitlistEntry {
  id: string
  email: string
  name?: string
  company_name?: string
  phone?: string
  message?: string
  status: "pending" | "contacted" | "converted" | "rejected"
  created_at: string
  updated_at: string
}

export default function WartlistePageClient() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleteTarget, setDeleteTarget] = useState<WaitlistEntry | null>(null)

  useEffect(() => {
    loadWaitlist()
  }, [])

  const loadWaitlist = async () => {
    try {
      const response = await fetch("/api/admin/waitlist")
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error("Error loading waitlist:", error)
      toast({
        title: "Fehler",
        description: "Warteliste konnte nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: WaitlistEntry["status"]) => {
    try {
      const response = await fetch(`/api/admin/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast({
          title: "Status aktualisiert",
          description: "Der Status wurde erfolgreich aktualisiert",
        })
        loadWaitlist()
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    }
  }

  const deleteEntry = async (entry: WaitlistEntry) => {
    try {
      const response = await fetch(`/api/admin/waitlist/${entry.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Eintrag geloescht",
          description: `${entry.email} wurde von der Warteliste entfernt`,
        })
        loadWaitlist()
      } else {
        throw new Error("Delete failed")
      }
    } catch (error) {
      console.error("Error deleting entry:", error)
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht geloescht werden",
        variant: "destructive",
      })
    } finally {
      setDeleteTarget(null)
    }
  }

  const exportToCSV = () => {
    const csv = [
      ["Email", "Name", "Firma", "Telefon", "Nachricht", "Status", "Erstellt am"].join(","),
      ...filteredEntries.map((entry) =>
        [
          entry.email,
          entry.name || "",
          entry.company_name || "",
          entry.phone || "",
          entry.message || "",
          entry.status,
          format(new Date(entry.created_at), "dd.MM.yyyy HH:mm", { locale: de }),
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `warteliste-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
  }

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      searchQuery === "" ||
      entry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.company_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || entry.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: entries.length,
    pending: entries.filter((e) => e.status === "pending").length,
    contacted: entries.filter((e) => e.status === "contacted").length,
    converted: entries.filter((e) => e.status === "converted").length,
  }

  const getStatusBadge = (status: WaitlistEntry["status"]) => {
    const variants = {
      pending: { label: "Ausstehend", variant: "outline" as const, icon: Clock },
      contacted: { label: "Kontaktiert", variant: "secondary" as const, icon: Mail },
      converted: { label: "Konvertiert", variant: "default" as const, icon: CheckCircle2 },
      rejected: { label: "Abgelehnt", variant: "destructive" as const, icon: XCircle },
    }

    const config = variants[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Lade Warteliste...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Warteliste</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Interessenten von der Coming Soon Seite
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Gesamt</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ausstehend</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Kontaktiert</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.contacted}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Konvertiert</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.converted}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Einträge ({filteredEntries.length})</CardTitle>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              CSV Export
            </Button>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen nach Email, Name oder Firma..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Status: {statusFilter === "all" ? "Alle" : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>Alle</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                  Ausstehend
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("contacted")}>
                  Kontaktiert
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("converted")}>
                  Konvertiert
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>
                  Abgelehnt
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Keine Einträge gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          className="flex items-center gap-2 hover:text-primary transition-colors text-left"
                          onClick={() => {
                            navigator.clipboard.writeText(entry.email)
                            toast({
                              title: "E-Mail kopiert",
                              description: `${entry.email} wurde in die Zwischenablage kopiert`,
                            })
                          }}
                          title="Klicken zum Kopieren"
                        >
                          {entry.email}
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </TableCell>
                      <TableCell>{entry.name || "-"}</TableCell>
                      <TableCell>{entry.company_name || "-"}</TableCell>
                      <TableCell>{entry.phone || "-"}</TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell>
                        {format(new Date(entry.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(entry.email)
                                toast({
                                  title: "E-Mail kopiert",
                                  description: `${entry.email} wurde in die Zwischenablage kopiert`,
                                })
                              }}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              E-Mail kopieren
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateStatus(entry.id, "pending")}>
                              Als Ausstehend markieren
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(entry.id, "contacted")}>
                              Als Kontaktiert markieren
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(entry.id, "converted")}>
                              Als Konvertiert markieren
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(entry.id, "rejected")}>
                              Als Abgelehnt markieren
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(entry)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eintrag loeschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Moechten Sie <span className="font-semibold text-foreground">{deleteTarget?.email}</span>
              {deleteTarget?.name ? ` (${deleteTarget.name})` : ""} wirklich von der Warteliste entfernen?
              Diese Aktion kann nicht rueckgaengig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteEntry(deleteTarget)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Endgueltig loeschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

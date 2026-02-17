"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Search, Download, Mail, Loader2, Users, Clock, CheckCircle2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { de } from "date-fns/locale"

interface WaitlistEntry {
  id: string
  email: string
  name?: string
  company?: string
  phone?: string
  message?: string
  source?: string
  status: string
  created_at: string
}

export default function WaitlistPageClient() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [exporting, setExporting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<WaitlistEntry | null>(null)

  useEffect(() => {
    fetchEntries()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = entries.filter(
        (entry) =>
          entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.company?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredEntries(filtered)
    } else {
      setFilteredEntries(entries)
    }
  }, [searchTerm, entries])

  const fetchEntries = async () => {
    try {
      const response = await fetch("/api/admin/waitlist")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setEntries(data.entries || [])
      setFilteredEntries(data.entries || [])
    } catch (error) {
      console.error("Error fetching waitlist:", error)
      toast({
        title: "Fehler",
        description: "Warteliste konnte nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    setExporting(true)
    try {
      const headers = ["E-Mail", "Name", "Firma", "Telefon", "Nachricht", "Quelle", "Status", "Erstellt am"]
      const csvData = filteredEntries.map((entry) => [
        entry.email,
        entry.name || "",
        entry.company || "",
        entry.phone || "",
        entry.message || "",
        entry.source || "",
        entry.status,
        format(new Date(entry.created_at), "dd.MM.yyyy HH:mm", { locale: de }),
      ])

      const csv = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `warteliste_${format(new Date(), "yyyy-MM-dd")}.csv`
      link.click()

      toast({
        title: "Export erfolgreich",
        description: `${filteredEntries.length} Einträge exportiert`,
      })
    } catch (error) {
      toast({
        title: "Export fehlgeschlagen",
        description: "CSV konnte nicht erstellt werden",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const deleteEntry = async (entry: WaitlistEntry) => {
    try {
      const response = await fetch(`/api/admin/waitlist/${entry.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Delete failed")

      toast({
        title: "Eintrag gelöscht",
        description: `${entry.email} wurde von der Warteliste entfernt`,
      })
      fetchEntries()
    } catch (error) {
      console.error("Error deleting entry:", error)
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht gelöscht werden",
        variant: "destructive",
      })
    } finally {
      setDeleteTarget(null)
    }
  }

  const stats = {
    total: entries.length,
    pending: entries.filter((e) => e.status === "pending").length,
    contacted: entries.filter((e) => e.status === "contacted").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Warteliste</h1>
        <p className="text-muted-foreground mt-2">Verwalten Sie Coming Soon Anmeldungen</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Alle Anmeldungen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Noch nicht kontaktiert</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kontaktiert</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contacted}</div>
            <p className="text-xs text-muted-foreground">Bereits bearbeitet</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions & Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Wartelisten-Einträge</CardTitle>
              <CardDescription>{filteredEntries.length} Einträge</CardDescription>
            </div>
            <Button onClick={exportToCSV} disabled={exporting || filteredEntries.length === 0}>
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportiere...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  CSV Export
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nach E-Mail, Name oder Firma suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erstellt am</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
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
                        <TableCell className="font-medium">{entry.email}</TableCell>
                        <TableCell>{entry.name || "-"}</TableCell>
                        <TableCell>{entry.company || "-"}</TableCell>
                        <TableCell>{entry.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={entry.status === "contacted" ? "default" : "secondary"}>
                            {entry.status === "contacted" ? "Kontaktiert" : "Ausstehend"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(entry.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => (window.location.href = `mailto:${entry.email}`)}
                              title="E-Mail senden"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(entry)}
                              title="Eintrag löschen"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie <span className="font-semibold text-foreground">{deleteTarget?.email}</span>
              {deleteTarget?.name ? ` (${deleteTarget.name})` : ""} wirklich von der Warteliste entfernen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteEntry(deleteTarget)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

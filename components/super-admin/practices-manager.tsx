"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  Building2,
  Pencil,
  Trash2,
  Eye,
  Users,
  Calendar,
  MoreHorizontal,
  Download,
  RefreshCw,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreatePracticeDialog } from "@/components/practice-dialog-create"
import { EditPracticeDialog } from "@/components/edit-practice-dialog"
import { useSuperAdminPractices, type Practice } from "@/lib/hooks/use-super-admin-practices"

export default function PracticesManager() {
  const { practices, stats, isLoading, error, refresh, deletePractice } = useSuperAdminPractices()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "deleted">("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingPractice, setEditingPractice] = useState<Practice | null>(null)

  const handleDelete = async (practiceId: number, practiceName: string) => {
    if (
      !confirm(
        `Möchten Sie die Praxis "${practiceName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      )
    ) {
      return
    }

    try {
      await deletePractice(practiceId)

      toast({
        title: "Erfolg",
        description: `Praxis "${practiceName}" wurde gelöscht.`,
      })
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Die Praxis konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    }
  }

  const filteredPractices = practices.filter((practice) => {
    const matchesSearch =
      practice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      practice.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      practice.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      practice.city?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? practice.isActive && !practice.deleted_at
          : statusFilter === "inactive"
            ? !practice.isActive && !practice.deleted_at
            : statusFilter === "deleted"
              ? !!practice.deleted_at
              : true

    return matchesSearch && matchesStatus
  })

  const handleExportCSV = () => {
    const headers = ["ID", "Name", "Typ", "Stadt", "PLZ", "E-Mail", "Telefon", "Mitglieder", "Status", "Erstellt"]
    const rows = filteredPractices.map((p) => [
      p.id,
      p.name,
      p.type,
      p.city,
      p.zipCode,
      p.email,
      p.phone,
      p.memberCount,
      p.isActive ? "Aktiv" : "Inaktiv",
      new Date(p.created_at).toLocaleDateString("de-DE"),
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `praxen_export_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-destructive">{error.message}</p>
            <Button variant="outline" className="mt-4 bg-transparent" onClick={() => refresh()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Erneut versuchen
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Praxen im System</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiv</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Aktive Praxen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inaktiv</CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Inaktive Praxen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gelöscht</CardTitle>
            <Trash2 className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deleted}</div>
            <p className="text-xs text-muted-foreground">Gelöschte Praxen</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Praxenverwaltung</CardTitle>
              <CardDescription>Erstellen, bearbeiten und verwalten Sie Praxen im System</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refresh()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportieren
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Neue Praxis
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Praxen durchsuchen..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: "all" | "active" | "inactive" | "deleted") => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Praxen</SelectItem>
                <SelectItem value="active">Nur Aktive</SelectItem>
                <SelectItem value="inactive">Nur Inaktive</SelectItem>
                <SelectItem value="deleted">Gelöschte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Praxen werden geladen...</p>
            </div>
          ) : filteredPractices.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Keine Praxen gefunden" : "Noch keine Praxen vorhanden"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Standort</TableHead>
                    <TableHead>Mitglieder</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPractices.map((practice) => (
                    <TableRow key={practice.id}>
                      <TableCell>
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: practice.color }}
                          title={practice.color}
                        />
                      </TableCell>
                      <TableCell>
                        <Link href={`/super-admin/practices/${practice.id}`} className="group">
                          <div className="font-medium group-hover:text-primary group-hover:underline transition-colors cursor-pointer">
                            {practice.name}
                          </div>
                          <div className="text-sm text-muted-foreground">{practice.email}</div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{practice.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {practice.city && practice.zipCode
                            ? `${practice.city}, ${practice.zipCode}`
                            : practice.city || practice.zipCode || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{practice.memberCount}</span>
                          {practice.adminCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({practice.adminCount} Admin{practice.adminCount !== 1 ? "s" : ""})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {practice.deleted_at ? (
                          <Badge variant="destructive">Gelöscht</Badge>
                        ) : (
                          <Badge variant={practice.isActive ? "default" : "secondary"}>
                            {practice.isActive ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(practice.created_at).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => window.open(`/super-admin/practices/${practice.id}`, "_self")}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Details ansehen
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingPractice(practice)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(practice.id, practice.name)}
                              disabled={!!practice.deleted_at}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreatePracticeDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) refresh()
        }}
      />

      {editingPractice && (
        <EditPracticeDialog
          open={!!editingPractice}
          onOpenChange={(open) => {
            if (!open) {
              setEditingPractice(null)
              refresh()
            }
          }}
          practice={editingPractice}
        />
      )}
    </div>
  )
}

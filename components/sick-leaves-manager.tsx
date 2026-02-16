"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  Plus,
  CalendarIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  FileText,
  Loader2,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { isActiveMember } from "@/lib/utils/team-member-filter"
import { isPracticeAdminRole, isSuperAdminRole } from "@/lib/auth-utils"

interface SickLeave {
  id: string
  practice_id: string
  user_id: string
  team_member_id?: string
  start_date: string
  end_date: string
  reason?: string
  notes?: string
  status: "pending" | "approved" | "rejected"
  approved_by?: string
  approved_at?: string
  document_url?: string
  created_by: string
  created_at: string
  total_days?: number
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  approved_by_user?: {
    id: string
    name: string
    email: string
  }
  team_member?: {
    id: string
    first_name: string
    last_name: string
  }
}

interface SickLeavesManagerProps {
  teamMembers?: any[]
}

function SickLeavesManager({ teamMembers = [] }: SickLeavesManagerProps) {
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()
  const [sickLeaves, setSickLeaves] = useState<SickLeave[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSickLeave, setEditingSickLeave] = useState<SickLeave | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString())

  // Form state
  const [formStartDate, setFormStartDate] = useState<Date | undefined>(undefined)
  const [formEndDate, setFormEndDate] = useState<Date | undefined>(undefined)
  const [formReason, setFormReason] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formUserId, setFormUserId] = useState("")

  const isAdmin = isPracticeAdminRole(currentUser?.role) || isSuperAdminRole(currentUser?.role) || currentUser?.is_super_admin

  useEffect(() => {
    fetchSickLeaves()
  }, [currentPractice?.id, statusFilter, yearFilter])

  const fetchSickLeaves = async () => {
    if (!currentPractice?.id) return

    setLoading(true)
    try {
      let url = `/api/practices/${currentPractice.id}/sick-leaves?year=${yearFilter}`
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`
      }
      // If not admin, only show own sick leaves
      if (!isAdmin) {
        url += `&userId=${currentUser?.id}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setSickLeaves(data.sickLeaves || [])
      } else {
        console.error("[v0] Error fetching sick leaves:", data.error)
        toast.error("Fehler beim Laden der Krankmeldungen")
      }
    } catch (error) {
      console.error("[v0] Exception fetching sick leaves:", error)
      toast.error("Fehler beim Laden der Krankmeldungen")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormStartDate(undefined)
    setFormEndDate(undefined)
    setFormReason("")
    setFormNotes("")
    setFormUserId(currentUser?.id || "")
  }

  const handleCreate = async () => {
    if (!formStartDate || !formEndDate) {
      toast.error("Bitte wählen Sie ein Start- und Enddatum")
      return
    }

    if (formEndDate < formStartDate) {
      toast.error("Das Enddatum muss nach dem Startdatum liegen")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice?.id}/sick-leaves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: formUserId || currentUser?.id,
          start_date: format(formStartDate, "yyyy-MM-dd"),
          end_date: format(formEndDate, "yyyy-MM-dd"),
          reason: formReason || null,
          notes: formNotes || null,
          status: isAdmin ? "approved" : "pending",
          created_by: currentUser?.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Krankmeldung erfolgreich erstellt")
        setShowCreateDialog(false)
        resetForm()
        fetchSickLeaves()
      } else {
        toast.error(data.error || "Fehler beim Erstellen der Krankmeldung")
      }
    } catch (error) {
      console.error("[v0] Exception creating sick leave:", error)
      toast.error("Fehler beim Erstellen der Krankmeldung")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingSickLeave || !formStartDate || !formEndDate) return

    setSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice?.id}/sick-leaves/${editingSickLeave.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: format(formStartDate, "yyyy-MM-dd"),
          end_date: format(formEndDate, "yyyy-MM-dd"),
          reason: formReason || null,
          notes: formNotes || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Krankmeldung erfolgreich aktualisiert")
        setEditingSickLeave(null)
        resetForm()
        fetchSickLeaves()
      } else {
        toast.error(data.error || "Fehler beim Aktualisieren der Krankmeldung")
      }
    } catch (error) {
      console.error("[v0] Exception updating sick leave:", error)
      toast.error("Fehler beim Aktualisieren der Krankmeldung")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diese Krankmeldung wirklich löschen?")) return

    try {
      const response = await fetch(`/api/practices/${currentPractice?.id}/sick-leaves/${id}`, { method: "DELETE" })

      if (response.ok) {
        toast.success("Krankmeldung erfolgreich gelöscht")
        fetchSickLeaves()
      } else {
        const data = await response.json()
        toast.error(data.error || "Fehler beim Löschen der Krankmeldung")
      }
    } catch (error) {
      console.error("[v0] Exception deleting sick leave:", error)
      toast.error("Fehler beim Löschen der Krankmeldung")
    }
  }

  const handleStatusChange = async (id: string, newStatus: "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/practices/${currentPractice?.id}/sick-leaves/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          approved_by: currentUser?.id,
        }),
      })

      if (response.ok) {
        toast.success(newStatus === "approved" ? "Krankmeldung genehmigt" : "Krankmeldung abgelehnt")
        fetchSickLeaves()
      } else {
        const data = await response.json()
        toast.error(data.error || "Fehler beim Aktualisieren des Status")
      }
    } catch (error) {
      console.error("[v0] Exception changing status:", error)
      toast.error("Fehler beim Aktualisieren des Status")
    }
  }

  const openEditDialog = (sickLeave: SickLeave) => {
    setEditingSickLeave(sickLeave)
    setFormStartDate(new Date(sickLeave.start_date))
    setFormEndDate(new Date(sickLeave.end_date))
    setFormReason(sickLeave.reason || "")
    setFormNotes(sickLeave.notes || "")
    setFormUserId(sickLeave.user_id)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Genehmigt</Badge>
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Abgelehnt</Badge>
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Ausstehend</Badge>
    }
  }

  const filteredSickLeaves = sickLeaves.filter((leave) => {
    if (!searchQuery) return true
    const tm = leave.team_member
    const userName = tm ? `${tm.first_name || ""} ${tm.last_name || ""}`.toLowerCase() : ""
    const reason = leave.reason?.toLowerCase() || ""
    return userName.includes(searchQuery.toLowerCase()) || reason.includes(searchQuery.toLowerCase())
  })

  // Calculate total sick days
  const totalSickDays = filteredSickLeaves.reduce((acc, leave) => acc + (leave.total_days || 0), 0)
  const pendingCount = filteredSickLeaves.filter((l) => l.status === "pending").length

  // Get unique users for the dropdown
  const users = [
    // Always include current user first
    { id: currentUser?.id || "", name: `${currentUser?.name || currentUser?.email || "Ich"} (Ich)` },
    // Then add all team members (excluding duplicates and current user)
    ...teamMembers
      .filter((m) => {
        const id = m.user_id || m.id
        return id && id.trim() !== "" && isActiveMember(m)
      })
      .map((m) => ({
        id: m.user_id || m.id,
        name: m.name || `${m.first_name || ""} ${m.last_name || ""}`.trim() || "Unbekannt",
      }))
      .filter((u) => u.id),
  ]

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kranktage gesamt</p>
                <p className="text-2xl font-bold">{totalSickDays}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Krankmeldungen</p>
                <p className="text-2xl font-bold">{filteredSickLeaves.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        {isAdmin && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ausstehend</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Krankmeldungen</CardTitle>
              <CardDescription>Verwalten Sie Ihre Krankmeldungen</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetForm()
                    setFormUserId(currentUser?.id || "")
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Neue Krankmeldung
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Neue Krankmeldung erstellen</DialogTitle>
                  <DialogDescription>Geben Sie die Details Ihrer Krankmeldung ein</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Mitarbeiter</Label>
                    <Select value={formUserId} onValueChange={setFormUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Mitarbeiter auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Startdatum</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formStartDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formStartDate ? format(formStartDate, "dd.MM.yyyy", { locale: de }) : "Datum wählen"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formStartDate}
                            onSelect={setFormStartDate}
                            locale={de}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid gap-2">
                      <Label>Enddatum</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formEndDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formEndDate ? format(formEndDate, "dd.MM.yyyy", { locale: de }) : "Datum wählen"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formEndDate}
                            onSelect={setFormEndDate}
                            locale={de}
                            disabled={(date) => (formStartDate ? date < formStartDate : false)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Grund (optional)</Label>
                    <Input
                      value={formReason}
                      onChange={(e) => setFormReason(e.target.value)}
                      placeholder="z.B. Erkältung, Grippe, etc."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Notizen (optional)</Label>
                    <Textarea
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Zusätzliche Informationen..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleCreate} disabled={saving || !formStartDate || !formEndDate}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Erstellen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen nach Name oder Grund..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="approved">Genehmigt</SelectItem>
                <SelectItem value="rejected">Abgelehnt</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Jahr" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSickLeaves.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Keine Krankmeldungen</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "Keine Krankmeldungen gefunden, die Ihren Filterkriterien entsprechen"
                  : "Es wurden noch keine Krankmeldungen erfasst"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {teamMembers.length > 0 && <TableHead>Mitarbeiter</TableHead>}
                    <TableHead>Zeitraum</TableHead>
                    <TableHead>Tage</TableHead>
                    <TableHead>Grund</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSickLeaves.map((leave) => (
                    <TableRow key={leave.id}>
                      {teamMembers.length > 0 && (
                        <TableCell>
                          <div className="flex items-center gap-2">
  <Avatar className="h-8 w-8">
  <AvatarFallback>{leave.team_member?.first_name?.charAt(0) || "?"}</AvatarFallback>
  </Avatar>
  <span className="font-medium">{leave.team_member ? `${leave.team_member.first_name || ""} ${leave.team_member.last_name || ""}`.trim() : "Unbekannt"}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(leave.start_date), "dd.MM.yyyy", { locale: de })}
                          {" - "}
                          {format(new Date(leave.end_date), "dd.MM.yyyy", { locale: de })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {leave.total_days} {leave.total_days === 1 ? "Tag" : "Tage"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{leave.reason || "-"}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(leave.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isAdmin && leave.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(leave.id, "approved")}>
                                  <Check className="mr-2 h-4 w-4 text-green-600" />
                                  Genehmigen
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(leave.id, "rejected")}>
                                  <X className="mr-2 h-4 w-4 text-red-600" />
                                  Ablehnen
                                </DropdownMenuItem>
                              </>
                            )}
                            {(leave.user_id === currentUser?.id || isAdmin) && (
                              <>
                                <DropdownMenuItem onClick={() => openEditDialog(leave)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(leave.id)} className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Löschen
                                </DropdownMenuItem>
                              </>
                            )}
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

      {/* Edit Dialog */}
      <Dialog open={!!editingSickLeave} onOpenChange={(open) => !open && setEditingSickLeave(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Krankmeldung bearbeiten</DialogTitle>
            <DialogDescription>Aktualisieren Sie die Details der Krankmeldung</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Startdatum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !formStartDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formStartDate ? format(formStartDate, "dd.MM.yyyy", { locale: de }) : "Datum wählen"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={formStartDate} onSelect={setFormStartDate} locale={de} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>Enddatum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !formEndDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formEndDate ? format(formEndDate, "dd.MM.yyyy", { locale: de }) : "Datum wählen"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={formEndDate} onSelect={setFormEndDate} locale={de} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Grund (optional)</Label>
              <Input
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="z.B. Erkältung, Grippe, etc."
              />
            </div>
            <div className="grid gap-2">
              <Label>Notizen (optional)</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Zusätzliche Informationen..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSickLeave(null)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdate} disabled={saving || !formStartDate || !formEndDate}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { SickLeavesManager }
export default SickLeavesManager

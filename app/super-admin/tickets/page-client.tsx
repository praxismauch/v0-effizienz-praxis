"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useTicketConfig } from "@/lib/tickets/hooks"
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  getTypeLabel,
  formatDateDE,
} from "@/lib/tickets/utils"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Ticket,
  Search,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Loader2,
  Bug,
  MessageSquare,
  ChevronDown,
  User,
  Building,
  Mail,
  Calendar,
  Eye,
  X,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Archive,
} from "lucide-react"

interface TicketItem {
  id: string
  title: string
  description: string
  status: "open" | "in_progress" | "resolved" | "closed" | "wont_fix"
  priority: "low" | "medium" | "high" | "urgent"
  type: "bug" | "feature_request" | "question" | "other"
  practice_id?: string
  practice_name?: string
  user_id?: string
  user_name?: string
  user_email?: string
  assigned_to?: string
  assigned_to_name?: string
  created_at: string
  updated_at: string
  resolved_at?: string
  messages_count?: number
  screenshot_urls?: string[]
  steps_to_reproduce?: string
  expected_behavior?: string
  actual_behavior?: string
}

interface TicketStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  avgResolutionDays: number
  highPriority: number
  urgent: number
}

export default function SuperAdminTicketManager() {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority">("newest")
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "all"
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null)
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    avgResolutionDays: 0,
    highPriority: 0,
    urgent: 0,
  })

  const { toast } = useToast()

  const { statuses, priorities, types, isLoading: configLoading } = useTicketConfig()

  useEffect(() => {
    fetchTickets()
  }, [filterStatus, filterType, filterPriority])

  useEffect(() => {
    calculateStats()
  }, [tickets])

  const fetchTickets = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterType !== "all") params.append("type", filterType)
      if (filterPriority !== "all") params.append("priority", filterPriority)

      const url = `/api/tickets?${params.toString()}`
      console.log("[v0] SuperAdmin fetchTickets - Calling:", url)

      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unbekannter Fehler" }))
        console.error("[v0] Tickets API error:", {
          status: response.status,
          error: errorData,
        })

        if (response.status === 404) {
          toast({
            title: "Tabelle nicht gefunden",
            description:
              "Die Tickets-Tabelle existiert noch nicht. Bitte führen Sie das SQL-Script aus: scripts/065_create_tickets_tables.sql",
            variant: "destructive",
          })
        } else if (response.status === 500) {
          toast({
            title: "Datenbankfehler",
            description:
              errorData.error || "Die Tickets konnten nicht geladen werden. Möglicherweise fehlt die Datenbanktabelle.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Fehler beim Laden",
            description: errorData.message || `HTTP ${response.status}: Tickets konnten nicht geladen werden`,
            variant: "destructive",
          })
        }

        setTickets([])
        return
      }

      const data = await response.json()
      console.log("[v0] SuperAdmin fetchTickets - Success:", {
        count: data.tickets?.length || 0,
      })
      setTickets(data.tickets || [])
    } catch (error) {
      console.error("[v0] SuperAdmin - Error loading tickets:", error)
      toast({
        title: "Netzwerkfehler",
        description: error instanceof Error ? error.message : "Verbindung zur API fehlgeschlagen",
        variant: "destructive",
      })
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const resolvedTickets = tickets.filter((t) => t.resolved_at && t.created_at)
    const avgDays =
      resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, ticket) => {
            const created = new Date(ticket.created_at).getTime()
            const resolved = new Date(ticket.resolved_at!).getTime()
            return sum + (resolved - created) / (1000 * 60 * 60 * 24)
          }, 0) / resolvedTickets.length
        : 0

    setStats({
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      in_progress: tickets.filter((t) => t.status === "in_progress").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      closed: tickets.filter((t) => t.status === "closed").length,
      avgResolutionDays: Math.round(avgDays),
      highPriority: tickets.filter((t) => t.priority === "high" || t.priority === "urgent").length,
      urgent: tickets.filter((t) => t.priority === "urgent").length,
    })
  }

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      console.log("[v0] SuperAdmin - Updating ticket status:", ticketId, newStatus)

      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Fehler beim Aktualisieren" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      toast({
        title: "Status aktualisiert",
        description: `Ticket-Status wurde auf "${getStatusLabel(newStatus, statuses)}" geändert.`,
      })

      // Update local state
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus as TicketItem["status"] } : t)),
      )
    } catch (error) {
      console.error("[v0] SuperAdmin - Error updating status:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Status konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    }
  }

  const handlePriorityChange = async (ticketId: string, newPriority: string) => {
    try {
      console.log("[v0] SuperAdmin - Updating ticket priority:", ticketId, newPriority)

      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Fehler beim Aktualisieren" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      toast({
        title: "Priorität aktualisiert",
        description: `Ticket-Priorität wurde auf "${getPriorityLabel(newPriority, priorities)}" geändert.`,
      })

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, priority: newPriority as TicketItem["priority"] } : t)),
      )
    } catch (error) {
      console.error("[v0] SuperAdmin - Error updating priority:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Priorität konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (ticketId: string) => {
    setTicketToDelete(ticketId)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!ticketToDelete) return

    const deletedTicketId = ticketToDelete

    setTickets((prevTickets) => prevTickets.filter((t) => t.id !== deletedTicketId))

    setShowDeleteDialog(false)
    setTicketToDelete(null)

    try {
      const response = await fetch(`/api/tickets/${deletedTicketId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Fehler beim Löschen" }))

        await fetchTickets()

        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      toast({
        title: "Ticket gelöscht",
        description: "Das Ticket wurde erfolgreich gelöscht.",
      })

      // UI already updated optimistically
    } catch (error) {
      console.error("[v0] SuperAdmin - Error deleting ticket:", error)
      await fetchTickets()
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Ticket konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  const handleViewDetails = (ticket: TicketItem) => {
    setSelectedTicket(ticket)
    setShowDetailsDialog(true)
  }

  const filteredTickets = tickets
    .filter((ticket) => {
      // Tab filter
      if (activeTab === "open") return ticket.status === "open"
      if (activeTab === "in_progress") return ticket.status === "in_progress"
      if (activeTab === "resolved") return ticket.status === "resolved" || ticket.status === "closed"
      return true
    })
    .filter((ticket) => {
      // Search filter
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        ticket.title?.toLowerCase().includes(query) ||
        ticket.description?.toLowerCase().includes(query) ||
        ticket.user_name?.toLowerCase().includes(query) ||
        ticket.user_email?.toLowerCase().includes(query) ||
        ticket.practice_name?.toLowerCase().includes(query) ||
        ticket.id?.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else {
        // priority
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
    })

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`/super-admin/tickets?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ticket-Verwaltung</h1>
          <p className="text-muted-foreground">Super Admin: Alle Support-Tickets und Bug-Reports</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesamt</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Ticket className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offen</p>
                <p className="text-3xl font-bold text-orange-600">{stats.open}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Bearbeitung</p>
                <p className="text-3xl font-bold text-blue-600">{stats.in_progress}</p>
              </div>
              <PlayCircle className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dringend</p>
                <p className="text-3xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Suche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ticket, Nutzer, Praxis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label_de}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Typ</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label_de}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priorität</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label_de}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sortierung</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Neueste zuerst</SelectItem>
                  <SelectItem value="oldest">Älteste zuerst</SelectItem>
                  <SelectItem value="priority">Nach Priorität</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            Alle
            <Badge variant="secondary" className="ml-2">
              {stats.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="open">
            Offen
            <Badge variant="secondary" className="ml-2">
              {stats.open}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Bearbeitung
            <Badge variant="secondary" className="ml-2">
              {stats.in_progress}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Erledigt
            <Badge variant="secondary" className="ml-2">
              {stats.resolved + stats.closed}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading || configLoading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-lg font-medium">Daten werden geladen...</p>
              </CardContent>
            </Card>
          ) : filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bug className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Keine Tickets gefunden</p>
                <p className="text-muted-foreground">
                  {searchQuery || filterStatus !== "all" || filterType !== "all" || filterPriority !== "all"
                    ? "Versuchen Sie andere Filter oder Suchbegriffe"
                    : "Es gibt derzeit keine Tickets"}
                </p>
                {(searchQuery || filterStatus !== "all" || filterType !== "all" || filterPriority !== "all") && (
                  <Button
                    variant="outline"
                    className="mt-4 bg-transparent"
                    onClick={() => {
                      setSearchQuery("")
                      setFilterStatus("all")
                      setFilterType("all")
                      setFilterPriority("all")
                    }}
                  >
                    Filter zurücksetzen
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Header: Title + Badges */}
                        <div className="flex items-start gap-2 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold leading-tight mb-1 break-words">{ticket.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                          </div>
                          <Badge
                            className={`${getTypeLabel(ticket.type, types) === "Bug" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"} shrink-0`}
                          >
                            {getTypeLabel(ticket.type, types)}
                          </Badge>
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          {ticket.user_name && (
                            <div className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              <span>{ticket.user_name}</span>
                            </div>
                          )}
                          {ticket.user_email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[200px]">{ticket.user_email}</span>
                            </div>
                          )}
                          {ticket.practice_name && (
                            <div className="flex items-center gap-1">
                              <Building className="h-3.5 w-3.5" />
                              <span>{ticket.practice_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDateDE(ticket.created_at)}</span>
                          </div>
                          {ticket.messages_count !== undefined && ticket.messages_count > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>{ticket.messages_count} Kommentare</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Priority Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={`h-8 ${getPriorityColor(ticket.priority, priorities)}`}
                              >
                                {getPriorityLabel(ticket.priority, priorities)}
                                <ChevronDown className="ml-1 h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuLabel>Priorität ändern</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {priorities.map((priority) => (
                                <DropdownMenuItem
                                  key={priority.value}
                                  onClick={() => handlePriorityChange(ticket.id, priority.value)}
                                >
                                  {priority.label_de}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Status Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="secondary" size="sm" className="h-8">
                                <span
                                  className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(ticket.status, statuses)}`}
                                />
                                {getStatusLabel(ticket.status, statuses)}
                                <ChevronDown className="ml-1 h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuLabel>Status ändern</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {statuses.map((status) => (
                                <DropdownMenuItem
                                  key={status.value}
                                  onClick={() => handleStatusChange(ticket.id, status.value)}
                                >
                                  {status.icon_name === "AlertCircle" && <AlertCircle className="mr-2 h-4 w-4" />}
                                  {status.icon_name === "PlayCircle" && <PlayCircle className="mr-2 h-4 w-4" />}
                                  {status.icon_name === "CheckCircle2" && <CheckCircle2 className="mr-2 h-4 w-4" />}
                                  {status.icon_name === "Archive" && <Archive className="mr-2 h-4 w-4" />}
                                  {status.icon_name === "XCircle" && <XCircle className="mr-2 h-4 w-4" />}
                                  {status.label_de}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(ticket)} className="h-8">
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            Details
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(ticket.id)}
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket-Details</DialogTitle>
            <DialogDescription>Vollständige Informationen zum Ticket</DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Titel</Label>
                <p className="text-sm font-medium">{selectedTicket.title}</p>
              </div>

              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {selectedTicket.steps_to_reproduce && (
                <div className="space-y-2">
                  <Label>Schritte zur Reproduktion</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.steps_to_reproduce}</p>
                </div>
              )}

              {selectedTicket.expected_behavior && (
                <div className="space-y-2">
                  <Label>Erwartetes Verhalten</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.expected_behavior}</p>
                </div>
              )}

              {selectedTicket.actual_behavior && (
                <div className="space-y-2">
                  <Label>Tatsächliches Verhalten</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.actual_behavior}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedTicket.status, statuses)}>
                    {getStatusLabel(selectedTicket.status, statuses)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label>Priorität</Label>
                  <Badge className={getPriorityColor(selectedTicket.priority, priorities)}>
                    {getPriorityLabel(selectedTicket.priority, priorities)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label>Typ</Label>
                  <p className="text-sm">{getTypeLabel(selectedTicket.type, types)}</p>
                </div>

                <div className="space-y-2">
                  <Label>Erstellt am</Label>
                  <p className="text-sm">{formatDateDE(selectedTicket.created_at)}</p>
                </div>

                {selectedTicket.user_name && (
                  <div className="space-y-2">
                    <Label>Erstellt von</Label>
                    <p className="text-sm">{selectedTicket.user_name}</p>
                  </div>
                )}

                {selectedTicket.user_email && (
                  <div className="space-y-2">
                    <Label>E-Mail</Label>
                    <p className="text-sm">{selectedTicket.user_email}</p>
                  </div>
                )}

                {selectedTicket.practice_name && (
                  <div className="space-y-2">
                    <Label>Praxis</Label>
                    <p className="text-sm">{selectedTicket.practice_name}</p>
                  </div>
                )}

                {selectedTicket.assigned_to_name && (
                  <div className="space-y-2">
                    <Label>Zugewiesen an</Label>
                    <p className="text-sm">{selectedTicket.assigned_to_name}</p>
                  </div>
                )}
              </div>

              {selectedTicket.screenshot_urls && selectedTicket.screenshot_urls.length > 0 && (
                <div className="space-y-2">
                  <Label>Screenshots</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTicket.screenshot_urls.map((url, index) => (
                      <img
                        key={index}
                        src={url || "/placeholder.svg"}
                        alt={`Screenshot ${index + 1}`}
                        className="rounded-lg border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ticket löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie dieses Ticket wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTicketToDelete(null)}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

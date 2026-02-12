"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useToast } from "@/hooks/use-toast"
import { getPriorityColor, getStatusColor, getTypeColor, getTypeLabel, formatDateDE } from "@/lib/tickets/utils"
import { useTicketConfig } from "@/lib/tickets/hooks"
import {
  Ticket,
  Search,
  Clock,
  AlertCircle,
  AlertTriangle,
  Pencil,
  Trash2,
  ShieldAlert,
  Loader2,
  Bug,
  Sparkles,
  Copy,
  Check,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/contexts/user-context"
import { ReportBugDialog } from "./report-bug-dialog"

interface TicketItem {
  id: string
  title: string
  description: string
  status: "open" | "in_progress" | "to_test" | "resolved" | "closed" | "wont_fix"
  priority: "low" | "medium" | "high" | "urgent"
  type: string
  practice_id: string
  practice_name?: string
  created_by: string
  user_name?: string
  user_email?: string
  assigned_to?: string
  assigned_to_name?: string
  created_at: string
  updated_at: string
  resolved_at?: string
  messages_count?: number
  screenshot_urls?: string[]
}

export default function TicketManagement() {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [ticketStatus, setTicketStatus] = useState("all")
  const [ticketType, setTicketType] = useState("all")
  const [ticketPriority, setTicketPriority] = useState("all")
  const [activeStatusTab, setActiveStatusTab] = useState("alle")
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [editingTicket, setEditingTicket] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<any>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null)
  const [aiActionText, setAiActionText] = useState("")
  const [aiActionLoading, setAiActionLoading] = useState<string | null>(null)
  const [aiActionDialogOpen, setAiActionDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const { toast } = useToast()
  const { user } = useUser()

  const { statuses, priorities, types, isLoading: configLoading } = useTicketConfig()

  useEffect(() => {
    const handleTicketCreated = (event: Event) => {
      console.log("[v0] TicketManagement - ticketCreated event received, refreshing list")
      fetchTickets()
    }

    window.addEventListener("ticketCreated", handleTicketCreated)

    return () => {
      window.removeEventListener("ticketCreated", handleTicketCreated)
    }
  }, [ticketStatus, ticketType, ticketPriority])

  useEffect(() => {
    console.log("[v0] TicketManagement - Fetching tickets with filters:", { ticketStatus, ticketType, ticketPriority })
    fetchTickets()
  }, [ticketStatus, ticketType, ticketPriority])

  const fetchTickets = async () => {
    try {
      console.log("[v0] fetchTickets - Starting with filters:", { ticketStatus, ticketType, ticketPriority })
      setLoading(true)

      const params = new URLSearchParams()
      if (ticketStatus !== "all") params.append("status", ticketStatus)
      if (ticketType !== "all") params.append("type", ticketType)
      if (ticketPriority !== "all") params.append("priority", ticketPriority)

      const url = `/api/tickets?${params.toString()}`
      console.log("[v0] fetchTickets - Calling API:", url)

      const response = await fetch(url)
      console.log("[v0] fetchTickets - Response status:", response.status, response.ok)

      if (response.status === 401) {
        console.error("[v0] Authentication error: User not logged in")
        console.warn("[v0] fetchTickets - 401 error, but user should be authenticated in super admin dashboard")
        setTickets([])
        setLoading(false)
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Tickets API error:", {
          status: response.status,
          error: errorData,
        })
        toast({
          title: "Fehler",
          description: errorData.message || "Tickets konnten nicht geladen werden",
          variant: "destructive",
        })
        setTickets([])
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log("[v0] fetchTickets - Success:", {
        count: data.tickets?.length || 0,
        tickets: data.tickets,
      })
      setTickets(data.tickets || [])
    } catch (error) {
      console.error("[v0] Error loading tickets:", error)
      toast({
        title: "Fehler",
        description: "Tickets konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTicket = async (ticketId: string, updates: any) => {
    try {
      console.log("[v0] Updating ticket:", ticketId, updates)
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        console.log("[v0] Ticket updated successfully")
        toast({
          title: "Erfolg",
          description: "Ticket wurde aktualisiert",
        })
        fetchTickets()
      } else {
        throw new Error("Failed to update ticket")
      }
    } catch (error) {
      console.error("[v0] Error updating ticket:", error)
      toast({
        title: "Fehler",
        description: "Ticket konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    }
  }

  const startEditing = (ticket: TicketItem) => {
    setEditingTicket(ticket.id)
    setEditedValues({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      type: ticket.type,
    })
  }

  const cancelEditing = () => {
    setEditingTicket(null)
    setEditedValues({})
  }

  const saveEditing = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedValues),
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: "Ticket wurde aktualisiert",
        })
        setEditingTicket(null)
        setEditedValues({})
        fetchTickets()
      } else {
        throw new Error("Failed to update ticket")
      }
    } catch (error) {
      console.error("[v0] Error updating ticket:", error)
      toast({
        title: "Fehler",
        description: "Ticket konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (ticketId: string) => {
    setTicketToDelete(ticketId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!ticketToDelete) return

    try {
      const response = await fetch(`/api/tickets/${ticketToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Ticket gelöscht",
          description: "Das Ticket wurde erfolgreich gelöscht.",
        })
        fetchTickets()
      } else {
        toast({
          title: "Fehler",
          description: "Das Ticket konnte nicht gelöscht werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error deleting ticket:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setTicketToDelete(null)
    }
  }

  const generateAiAction = async (ticket: TicketItem) => {
    setAiActionLoading(ticket.id)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/ai-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ticket.title,
          description: ticket.description,
          type: ticket.type,
          priority: ticket.priority,
          screenshots: ticket.screenshot_urls || [],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAiActionText(data.actionItem || "")
        setAiActionDialogOpen(true)
      } else {
        toast({ title: "Fehler", description: "KI-Aktion konnte nicht generiert werden", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error generating AI action:", error)
      toast({ title: "Fehler", description: "KI-Aktion konnte nicht generiert werden", variant: "destructive" })
    } finally {
      setAiActionLoading(null)
    }
  }

  const handleCopyAiAction = async () => {
    try {
      await navigator.clipboard.writeText(aiActionText)
      setCopied(true)
      toast({ title: "Kopiert", description: "v0 Anweisung in die Zwischenablage kopiert" })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: "Fehler", description: "Kopieren fehlgeschlagen", variant: "destructive" })
    }
  }

  const filteredTickets = tickets
    .filter((ticket) => {
      if (activeStatusTab === "alle") return true
      if (activeStatusTab === "offen") return ticket.status === "open"
      if (activeStatusTab === "in_bearbeitung") return ticket.status === "in_progress"
      if (activeStatusTab === "zu_testen") return ticket.status === "to_test"
      if (activeStatusTab === "archiv") {
        return ["closed", "resolved", "wont_fix"].includes(ticket.status)
      }
      return true
    })
    .filter((ticket) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        ticket.title?.toLowerCase().includes(query) ||
        ticket.description?.toLowerCase().includes(query) ||
        ticket.user_name?.toLowerCase().includes(query) ||
        ticket.user_email?.toLowerCase().includes(query)
      )
    })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ticket-Verwaltung</h2>
          <p className="text-muted-foreground">Verwalten Sie Support-Tickets und Bug-Reports</p>
        </div>
        <ReportBugDialog onTicketCreated={fetchTickets} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesamt</p>
                <p className="text-2xl font-bold">{tickets.length}</p>
              </div>
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offen</p>
                <p className="text-2xl font-bold text-orange-600">
                  {tickets.filter((t) => t.status === "open").length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ø Lösungszeit</p>
                <p className="text-2xl font-bold">
                  {(() => {
                    const resolvedTickets = tickets.filter((t) => t.resolved_at && t.created_at)
                    if (resolvedTickets.length === 0) return "0d"

                    const totalDays = resolvedTickets.reduce((sum, ticket) => {
                      const created = new Date(ticket.created_at).getTime()
                      const resolved = new Date(ticket.resolved_at!).getTime()
                      return sum + (resolved - created) / (1000 * 60 * 60 * 24)
                    }, 0)

                    const avgDays = Math.round(totalDays / resolvedTickets.length)
                    return `${avgDays}d`
                  })()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hohe Priorität</p>
                <p className="text-2xl font-bold text-red-600">{tickets.filter((t) => t.priority === "high").length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Suche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ticket durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={ticketStatus} onValueChange={setTicketStatus}>
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
              <Select value={ticketType} onValueChange={setTicketType}>
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
              <Select value={ticketPriority} onValueChange={setTicketPriority}>
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
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeStatusTab} onValueChange={setActiveStatusTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="offen">
            Offen
            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
              {tickets.filter((t) => t.status === "open").length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="in_bearbeitung">
            In Bearbeitung
            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
              {tickets.filter((t) => t.status === "in_progress").length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="zu_testen">
            Zu testen
            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
              {tickets.filter((t) => t.status === "to_test").length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="archiv">
            Archiv
            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
              {tickets.filter((t) => ["closed", "resolved", "wont_fix"].includes(t.status)).length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="alle">
            Alle
            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">{tickets.length}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading || configLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Tickets werden geladen...</p>
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bug className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Keine Tickets gefunden</p>
            <p className="text-muted-foreground">Es gibt derzeit keine Tickets mit den ausgewählten Filtern</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTickets.map((ticket) => {
            const isEditing = editingTicket === ticket.id

            return (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Titel</Label>
                        <Input
                          value={editedValues.title || ""}
                          onChange={(e) => setEditedValues({ ...editedValues, title: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Beschreibung</Label>
                        <Textarea
                          value={editedValues.description || ""}
                          onChange={(e) => setEditedValues({ ...editedValues, description: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Priorität</Label>
                          <Select
                            value={editedValues.priority}
                            onValueChange={(value) => setEditedValues({ ...editedValues, priority: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {priorities.map((priority) => (
                                <SelectItem key={priority.value} value={priority.value}>
                                  {priority.label_de}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Typ</Label>
                          <Select
                            value={editedValues.type}
                            onValueChange={(value) => setEditedValues({ ...editedValues, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {types.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label_de}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={cancelEditing}>
                          Abbrechen
                        </Button>
                        <Button size="sm" onClick={() => saveEditing(ticket.id)}>
                          Speichern
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {ticket.practice_id === "0" && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                              <ShieldAlert className="h-3 w-3 mr-1" />
                              Super Admin
                            </Badge>
                          )}
                          <Badge className={getPriorityColor(ticket.priority, priorities)}>{ticket.priority}</Badge>
                          <Badge className={getStatusColor(ticket.status, statuses)}>{ticket.status}</Badge>
                          <Badge className={getTypeColor(ticket.type)}>{getTypeLabel(ticket.type, types)}</Badge>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{ticket.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ticket.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Von: {ticket.user_name || ticket.user_email}</span>
                          <span>•</span>
                          <span>{new Date(ticket.created_at).toLocaleDateString("de-DE")}</span>
                          {ticket.screenshot_urls && ticket.screenshot_urls.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{ticket.screenshot_urls.length} Screenshot(s)</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateAiAction(ticket)}
                          disabled={aiActionLoading === ticket.id}
                          className="text-primary border-primary/30 hover:bg-primary/5"
                        >
                          {aiActionLoading === ticket.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-1" />
                          )}
                          v0 Aktion
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => startEditing(ticket)}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Bearbeiten
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setShowDetails(true)
                          }}
                        >
                          Details
                        </Button>
                        <Select
                          value={ticket.status}
                          onValueChange={(value) => handleUpdateTicket(ticket.id, { status: value })}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label_de}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(ticket.id)}
                          title="Ticket löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ticket löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie dieses Ticket wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>Vollständige Ticket-Informationen</DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Titel</Label>
                <p className="mt-1 text-sm">{selectedTicket.title}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Beschreibung</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge className={`mt-1 ${getStatusColor(selectedTicket.status, statuses)}`}>
                    {selectedTicket.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Priorität</Label>
                  <Badge className={`mt-1 ${getPriorityColor(selectedTicket.priority, priorities)}`}>
                    {selectedTicket.priority}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Typ</Label>
                  <Badge className={`mt-1 ${getTypeColor(selectedTicket.type)}`}>
                    {getTypeLabel(selectedTicket.type, types)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Erstellt am</Label>
                  <p className="mt-1 text-sm">{formatDateDE(selectedTicket.created_at)}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Erstellt von</Label>
                <p className="mt-1 text-sm">{selectedTicket.user_name || selectedTicket.user_email}</p>
              </div>
              {selectedTicket.screenshot_urls && selectedTicket.screenshot_urls.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Screenshots</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {selectedTicket.screenshot_urls.map((url, index) => (
                      <img
                        key={index}
                        src={url || "/placeholder.svg"}
                        alt={`Screenshot ${index + 1}`}
                        className="rounded border w-full h-auto"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Schließen
            </Button>
            {selectedTicket && (
              <Button
                onClick={() => generateAiAction(selectedTicket)}
                disabled={aiActionLoading === selectedTicket.id}
                className="gap-2"
              >
                {aiActionLoading === selectedTicket.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                v0 Aktion generieren
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Action Item Dialog */}
      <Dialog open={aiActionDialogOpen} onOpenChange={setAiActionDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              v0 Entwicklungsanweisung
            </DialogTitle>
            <DialogDescription>
              Diese Anweisung wurde automatisch generiert und kann direkt in den v0 Chat kopiert werden.
            </DialogDescription>
          </DialogHeader>

          {aiActionLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">KI generiert Anweisung...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground">{aiActionText}</pre>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Kopieren Sie den Text und fugen Sie ihn in den v0 Chat ein, um das Problem automatisch losen zu lassen.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiActionDialogOpen(false)}>
              Schliessen
            </Button>
            <Button onClick={handleCopyAiAction} disabled={!aiActionText} className="gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Kopiert
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  In Zwischenablage kopieren
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

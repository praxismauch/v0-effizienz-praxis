"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useTicketConfig } from "@/lib/tickets/hooks"
import { Loader2, Bug } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { ReportBugDialog } from "./report-bug-dialog"
import type { TicketItem } from "./tickets/ticket-types"
import { TicketStatsCards } from "./tickets/ticket-stats-cards"
import { TicketFilterBar } from "./tickets/ticket-filter-bar"
import { TicketCard } from "./tickets/ticket-card"
import { TicketDetailDialog } from "./tickets/ticket-detail-dialog"
import { TicketAiActionDialog } from "./tickets/ticket-ai-action-dialog"

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null)
  const [aiActionText, setAiActionText] = useState("")
  const [aiActionLoading, setAiActionLoading] = useState<string | null>(null)
  const [aiActionDialogOpen, setAiActionDialogOpen] = useState(false)

  const { toast } = useToast()
  const { user } = useUser()
  const { statuses, priorities, types, isLoading: configLoading } = useTicketConfig()

  useEffect(() => {
    const handleTicketCreated = () => fetchTickets()
    window.addEventListener("ticketCreated", handleTicketCreated)
    return () => window.removeEventListener("ticketCreated", handleTicketCreated)
  }, [ticketStatus, ticketType, ticketPriority])

  useEffect(() => {
    fetchTickets()
  }, [ticketStatus, ticketType, ticketPriority])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (ticketStatus !== "all") params.append("status", ticketStatus)
      if (ticketType !== "all") params.append("type", ticketType)
      if (ticketPriority !== "all") params.append("priority", ticketPriority)

      const response = await fetch(`/api/tickets?${params.toString()}`)
      if (response.status === 401) {
        setTickets([])
        return
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        toast({ title: "Fehler", description: errorData.message || "Tickets konnten nicht geladen werden", variant: "destructive" })
        setTickets([])
        return
      }
      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (error) {
      toast({ title: "Fehler", description: "Tickets konnten nicht geladen werden", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTicket = async (ticketId: string, updates: any) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (response.ok) {
        toast({ title: "Erfolg", description: "Ticket wurde aktualisiert" })
        fetchTickets()
      } else {
        throw new Error("Failed to update ticket")
      }
    } catch {
      toast({ title: "Fehler", description: "Ticket konnte nicht aktualisiert werden", variant: "destructive" })
    }
  }

  const handleEditTicket = async (ticketId: string, values: any) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (response.ok) {
        toast({ title: "Erfolg", description: "Ticket wurde aktualisiert" })
        fetchTickets()
      } else {
        throw new Error("Failed to update ticket")
      }
    } catch {
      toast({ title: "Fehler", description: "Ticket konnte nicht aktualisiert werden", variant: "destructive" })
    }
  }

  const handleDeleteClick = (ticketId: string) => {
    setTicketToDelete(ticketId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!ticketToDelete) return
    try {
      const response = await fetch(`/api/tickets/${ticketToDelete}`, { method: "DELETE" })
      if (response.ok) {
        toast({ title: "Ticket gelöscht", description: "Das Ticket wurde erfolgreich gelöscht." })
        fetchTickets()
      } else {
        toast({ title: "Fehler", description: "Das Ticket konnte nicht gelöscht werden.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Fehler", description: "Ein Fehler ist aufgetreten.", variant: "destructive" })
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
    } catch {
      toast({ title: "Fehler", description: "KI-Aktion konnte nicht generiert werden", variant: "destructive" })
    } finally {
      setAiActionLoading(null)
    }
  }

  const filteredTickets = tickets
    .filter((ticket) => {
      if (activeStatusTab === "alle") return true
      if (activeStatusTab === "offen") return ticket.status === "open"
      if (activeStatusTab === "in_bearbeitung") return ticket.status === "in_progress"
      if (activeStatusTab === "zu_testen") return ticket.status === "to_test"
      if (activeStatusTab === "archiv") return ["closed", "resolved", "wont_fix"].includes(ticket.status)
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

      <TicketStatsCards tickets={tickets} />

      <TicketFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        ticketStatus={ticketStatus}
        onStatusChange={setTicketStatus}
        ticketType={ticketType}
        onTypeChange={setTicketType}
        ticketPriority={ticketPriority}
        onPriorityChange={setTicketPriority}
        statuses={statuses}
        types={types}
        priorities={priorities}
      />

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
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              statuses={statuses}
              priorities={priorities}
              types={types}
              onUpdateStatus={handleUpdateTicket}
              onEdit={handleEditTicket}
              onDelete={handleDeleteClick}
              onShowDetails={(t) => { setSelectedTicket(t); setShowDetails(true) }}
              onGenerateAiAction={generateAiAction}
              aiActionLoading={aiActionLoading}
            />
          ))}
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

      <TicketDetailDialog
        ticket={selectedTicket}
        open={showDetails}
        onOpenChange={setShowDetails}
        statuses={statuses}
        priorities={priorities}
        types={types}
        onGenerateAiAction={generateAiAction}
        aiActionLoading={aiActionLoading}
      />

      <TicketAiActionDialog
        open={aiActionDialogOpen}
        onOpenChange={setAiActionDialogOpen}
        actionText={aiActionText}
        isLoading={!!aiActionLoading}
      />
    </div>
  )
}

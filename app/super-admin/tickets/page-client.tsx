"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, Bug } from "lucide-react"

// Import extracted components
import { TicketStatsCards } from "./components/ticket-stats-cards"
import { TicketFilters } from "./components/ticket-filters"
import { TicketCard } from "./components/ticket-card"
import { TicketDetailsDialog } from "./components/ticket-details-dialog"

// Import types
import type { TicketItem, TicketStats } from "./types"

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

      const response = await fetch(`/api/super-admin/tickets?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch tickets")
      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (error) {
      toast({ title: "Fehler", description: "Tickets konnten nicht geladen werden", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const newStats: TicketStats = {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      in_progress: tickets.filter((t) => t.status === "in_progress").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      closed: tickets.filter((t) => t.status === "closed").length,
      avgResolutionDays: 0,
      highPriority: tickets.filter((t) => t.priority === "high").length,
      urgent: tickets.filter((t) => t.priority === "urgent").length,
    }
    setStats(newStats)
  }

  const handleTabChange = (value: string) => {
    router.push(`/super-admin/tickets?tab=${value}`)
  }

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/super-admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error("Failed to update status")
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus as TicketItem["status"] } : t)))
      toast({ title: "Erfolg", description: "Status wurde aktualisiert" })
    } catch (error) {
      toast({ title: "Fehler", description: "Status konnte nicht geändert werden", variant: "destructive" })
    }
  }

  const handlePriorityChange = async (ticketId: string, newPriority: string) => {
    try {
      const response = await fetch(`/api/super-admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      })
      if (!response.ok) throw new Error("Failed to update priority")
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, priority: newPriority as TicketItem["priority"] } : t)))
      toast({ title: "Erfolg", description: "Priorität wurde aktualisiert" })
    } catch (error) {
      toast({ title: "Fehler", description: "Priorität konnte nicht geändert werden", variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (!ticketToDelete) return
    try {
      const response = await fetch(`/api/super-admin/tickets/${ticketToDelete}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete ticket")
      setTickets((prev) => prev.filter((t) => t.id !== ticketToDelete))
      toast({ title: "Erfolg", description: "Ticket wurde gelöscht" })
    } catch (error) {
      toast({ title: "Fehler", description: "Ticket konnte nicht gelöscht werden", variant: "destructive" })
    } finally {
      setShowDeleteDialog(false)
      setTicketToDelete(null)
    }
  }

  const filteredTickets = useMemo(() => {
    let filtered = [...tickets]

    // Filter by tab
    if (activeTab === "open") filtered = filtered.filter((t) => t.status === "open")
    else if (activeTab === "in_progress") filtered = filtered.filter((t) => t.status === "in_progress")
    else if (activeTab === "resolved") filtered = filtered.filter((t) => t.status === "resolved" || t.status === "closed")

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.user_name?.toLowerCase().includes(query) ||
          t.user_email?.toLowerCase().includes(query) ||
          t.practice_name?.toLowerCase().includes(query)
      )
    }

    // Sort
    if (sortBy === "newest") filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sortBy === "oldest") filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    else if (sortBy === "priority") {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    }

    return filtered
  }, [tickets, activeTab, searchQuery, sortBy])

  const resetFilters = () => {
    setSearchQuery("")
    setFilterStatus("all")
    setFilterType("all")
    setFilterPriority("all")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ticket-Verwaltung</h1>
        <p className="text-muted-foreground">Verwalten Sie alle Support-Tickets</p>
      </div>

      {/* Stats Cards */}
      <TicketStatsCards stats={stats} />

      {/* Filters */}
      <TicketFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterPriority={filterPriority}
        onFilterPriorityChange={setFilterPriority}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        statuses={statuses}
        types={types}
        priorities={priorities}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
          <TabsTrigger value="all">Alle <Badge variant="secondary" className="ml-2">{stats.total}</Badge></TabsTrigger>
          <TabsTrigger value="open">Offen <Badge variant="secondary" className="ml-2">{stats.open}</Badge></TabsTrigger>
          <TabsTrigger value="in_progress">In Bearbeitung <Badge variant="secondary" className="ml-2">{stats.in_progress}</Badge></TabsTrigger>
          <TabsTrigger value="resolved">Erledigt <Badge variant="secondary" className="ml-2">{stats.resolved + stats.closed}</Badge></TabsTrigger>
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
                  <Button variant="outline" className="mt-4 bg-transparent" onClick={resetFilters}>
                    Filter zurücksetzen
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  statuses={statuses}
                  priorities={priorities}
                  types={types}
                  onStatusChange={handleStatusChange}
                  onPriorityChange={handlePriorityChange}
                  onViewDetails={(t) => { setSelectedTicket(t); setShowDetailsDialog(true) }}
                  onDelete={(id) => { setTicketToDelete(id); setShowDeleteDialog(true) }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <TicketDetailsDialog
        ticket={selectedTicket}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        statuses={statuses}
        priorities={priorities}
        types={types}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ticket löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Das Ticket wird permanent gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

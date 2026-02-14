"use client"

import type React from "react"
import { useState, useEffect } from "react"
import AppLayout from "@/components/app-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bug, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ReportBugDialog from "@/components/report-bug-dialog"
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
import { useTicketConfig } from "@/lib/tickets/hooks"
import { getStatusLabel, getPriorityLabel, statusesToOptions, prioritiesToOptions } from "@/lib/tickets/utils"
import { TicketFilters } from "./ticket-filters"
import { TicketCard } from "./ticket-card"

export const dynamic = "force-dynamic"

export default function TicketsPage() {
  const { toast } = useToast()
  const { statuses, priorities, types, isLoading: configLoading } = useTicketConfig()

  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null)
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<string>("newest")
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null)

  const statusOptions = statuses ? statusesToOptions(statuses) : []
  const priorityOptions = priorities ? prioritiesToOptions(priorities) : []

  useEffect(() => {
    const handleTicketCreated = () => fetchTickets()
    window.addEventListener("ticketCreated", handleTicketCreated)
    return () => window.removeEventListener("ticketCreated", handleTicketCreated)
  }, [])

  useEffect(() => { fetchTickets() }, [activeTab])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeTab !== "all") params.append("status", activeTab)
      const response = await fetch(`/api/tickets?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      toast({ title: "Fehler beim Laden", description: error instanceof Error ? error.message : "Tickets konnten nicht geladen werden.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedTickets = tickets
    .filter((ticket) => {
      const passesTab = activeTab === "all"
        || (activeTab === "open" && (ticket.status === "open" || ticket.status === "in_progress"))
        || (activeTab === "resolved" && (ticket.status === "resolved" || ticket.status === "closed"))
        || ticket.status === activeTab

      const passesSearch = searchQuery === ""
        || ticket.title?.toLowerCase().includes(searchQuery.toLowerCase())
        || ticket.description?.toLowerCase().includes(searchQuery.toLowerCase())
        || ticket.created_by_name?.toLowerCase().includes(searchQuery.toLowerCase())

      const passesPriority = filterPriority === "all" || ticket.priority === filterPriority
      const passesType = filterType === "all" || ticket.type === filterType

      return passesTab && passesSearch && passesPriority && passesType
    })
    .sort((a, b) => {
      if (sortOrder === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortOrder === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortOrder === "priority") {
        const order = ["low", "medium", "high", "urgent"]
        return order.indexOf(a.priority) - order.indexOf(b.priority)
      }
      return 0
    })

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) })
      if (response.ok) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)))
        toast({ title: "Status aktualisiert", description: `Status wurde auf "${getStatusLabel(newStatus)}" geändert.` })
      } else {
        toast({ title: "Fehler", description: "Der Status konnte nicht aktualisiert werden.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Fehler", description: "Ein Fehler ist aufgetreten.", variant: "destructive" })
    }
  }

  const handlePriorityChange = async (ticketId: string, newPriority: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priority: newPriority }) })
      if (response.ok) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, priority: newPriority } : t)))
        toast({ title: "Priorität aktualisiert", description: `Priorität wurde auf "${getPriorityLabel(newPriority)}" geändert.` })
      } else {
        toast({ title: "Fehler", description: "Die Priorität konnte nicht aktualisiert werden.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Fehler", description: "Ein Fehler ist aufgetreten.", variant: "destructive" })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTicketId) return
    const id = deletingTicketId
    setTickets((prev) => prev.filter((t) => t.id !== id))
    if (expandedTicketId === id) setExpandedTicketId(null)
    setDeletingTicketId(null)
    try {
      const response = await fetch(`/api/tickets/${id}`, { method: "DELETE" })
      if (!response.ok) {
        await fetchTickets()
        const errorData = await response.json().catch(() => ({}))
        toast({ title: "Fehler", description: errorData.error || "Das Ticket konnte nicht gelöscht werden.", variant: "destructive" })
        return
      }
      toast({ title: "Ticket gelöscht", description: "Das Ticket wurde erfolgreich gelöscht." })
    } catch {
      await fetchTickets()
      toast({ title: "Fehler", description: "Ein unerwarteter Fehler ist aufgetreten.", variant: "destructive" })
    }
  }

  const copyTicketTitle = async (title: string, ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(title)
      setCopiedTicketId(ticketId)
      setTimeout(() => setCopiedTicketId(null), 2000)
    } catch { /* ignore */ }
  }

  return (
    <AppLayout loading={loading || configLoading} loadingMessage="Tickets werden geladen...">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
            <p className="text-muted-foreground">Verwalten Sie Ihre Support-Anfragen und Bug-Reports</p>
          </div>
          <Button onClick={() => setShowReportDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neues Ticket erstellen
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto gap-1">
            <TabsTrigger value="all">Alle ({tickets.length})</TabsTrigger>
            <TabsTrigger value="open">Offen ({tickets.filter((t) => t.status === "open" || t.status === "in_progress").length})</TabsTrigger>
            <TabsTrigger value="resolved">Gelöst ({tickets.filter((t) => t.status === "resolved" || t.status === "closed").length})</TabsTrigger>
          </TabsList>

          <TicketFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            filterPriority={filterPriority}
            onFilterPriorityChange={setFilterPriority}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            statusOptions={statusOptions}
            priorityOptions={priorityOptions}
            types={types}
            onCreateTicket={() => setShowReportDialog(true)}
          />

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {loading || configLoading ? (
              <div className="text-center py-12"><p className="text-muted-foreground">Tickets werden geladen...</p></div>
            ) : filteredAndSortedTickets.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bug className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    {searchQuery || filterPriority !== "all" || filterType !== "all" ? "Keine Tickets gefunden" : "Keine Tickets vorhanden"}
                  </p>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || filterPriority !== "all" || filterType !== "all"
                      ? "Versuchen Sie, Ihre Filter anzupassen"
                      : "Sie haben noch keine Support-Anfragen erstellt"}
                  </p>
                  {searchQuery || filterPriority !== "all" || filterType !== "all" ? (
                    <Button variant="outline" onClick={() => { setSearchQuery(""); setFilterPriority("all"); setFilterType("all") }}>Filter zurücksetzen</Button>
                  ) : (
                    <Button onClick={() => setShowReportDialog(true)}><Plus className="h-4 w-4 mr-2" />Erstes Ticket erstellen</Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredAndSortedTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    isExpanded={expandedTicketId === ticket.id}
                    isCopied={copiedTicketId === ticket.id}
                    statusOptions={statusOptions}
                    priorityOptions={priorityOptions}
                    onToggleExpand={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                    onStatusChange={handleStatusChange}
                    onPriorityChange={handlePriorityChange}
                    onDelete={(id) => setDeletingTicketId(id)}
                    onCopyTitle={copyTicketTitle}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ReportBugDialog open={showReportDialog} onOpenChange={setShowReportDialog} />

      <AlertDialog open={!!deletingTicketId} onOpenChange={(open) => !open && setDeletingTicketId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ticket löschen?</AlertDialogTitle>
            <AlertDialogDescription>Möchten Sie dieses Ticket wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="h-4 w-4 mr-2" />Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}

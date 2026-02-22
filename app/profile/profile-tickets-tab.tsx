"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { Bug, Plus, Trash2, Search, X, ChevronDown, Copy, Check, Pencil, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ReportBugDialog from "@/components/report-bug-dialog"
import { useTicketConfig } from "@/lib/tickets/hooks"
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  getPriorityIcon,
  getTypeLabel,
  statusesToOptions,
  prioritiesToOptions,
} from "@/lib/tickets/utils"
import { formatDateDE } from "@/lib/utils"

export function ProfileTicketsTab() {
  const { toast } = useToast()
  const { statuses, priorities, types, isLoading: configLoading } = useTicketConfig()

  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null)
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<string>("newest")
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null)

  const statusOptions = statuses ? statusesToOptions(statuses) : []
  const priorityOptions = priorities ? prioritiesToOptions(priorities) : []

  useEffect(() => {
    const handleTicketCreated = () => fetchTickets()
    window.addEventListener("ticketCreated", handleTicketCreated)
    return () => window.removeEventListener("ticketCreated", handleTicketCreated)
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/tickets")
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Tickets konnten nicht geladen werden.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedTickets = tickets
    .filter((ticket) => {
      const passesStatus = filterStatus === "all" || ticket.status === filterStatus
      const passesSearch =
        searchQuery === "" ||
        ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const passesPriority = filterPriority === "all" || ticket.priority === filterPriority
      return passesStatus && passesSearch && passesPriority
    })
    .sort((a, b) => {
      if (sortOrder === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortOrder === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortOrder === "priority") {
        const order = ["low", "medium", "high", "urgent"]
        return order.indexOf(b.priority) - order.indexOf(a.priority)
      }
      return 0
    })

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)))
        toast({ title: "Status aktualisiert" })
      }
    } catch {
      toast({ title: "Fehler", variant: "destructive" })
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
      if (response.ok) {
        toast({ title: "Ticket gelöscht" })
      } else {
        await fetchTickets()
        toast({ title: "Fehler", variant: "destructive" })
      }
    } catch {
      await fetchTickets()
    }
  }

  const copyTitle = async (title: string, ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(title)
      setCopiedTicketId(ticketId)
      setTimeout(() => setCopiedTicketId(null), 2000)
    } catch {
      /* ignore */
    }
  }

  const openCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length
  const resolvedCount = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length

  if (loading || configLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Tickets werden geladen...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{tickets.length}</p>
            <p className="text-sm text-muted-foreground">Gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{openCount}</p>
            <p className="text-sm text-muted-foreground">Offen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
            <p className="text-sm text-muted-foreground">Gelöst</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ticket durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
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
            <Button onClick={() => setShowReportDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Ticket
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Alle Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Alle Prioritäten" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Prioritäten</SelectItem>
                {priorityOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
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
        </CardContent>
      </Card>

      {/* Ticket List */}
      {filteredAndSortedTickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bug className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {searchQuery || filterPriority !== "all" || filterStatus !== "all"
                ? "Keine Tickets gefunden"
                : "Keine Tickets vorhanden"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || filterPriority !== "all" || filterStatus !== "all"
                ? "Versuchen Sie, Ihre Filter anzupassen"
                : "Sie haben noch keine Support-Anfragen erstellt"}
            </p>
            {!(searchQuery || filterPriority !== "all" || filterStatus !== "all") && (
              <Button onClick={() => setShowReportDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Erstes Ticket erstellen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedTickets.map((ticket) => {
            const isExpanded = expandedTicketId === ticket.id
            return (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Badges row */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={`${getPriorityColor(ticket.priority)} text-white border-0 text-xs`}>
                          <span className="mr-1">{getPriorityIcon(ticket.priority)}</span>
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`${getStatusColor(ticket.status)} text-white border-0 h-5 px-2 text-xs gap-1`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {getStatusLabel(ticket.status)}
                              <ChevronDown className="h-3 w-3 opacity-70" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="z-[9999]">
                            {statusOptions.map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(ticket.id, option.value)
                                }}
                              >
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(ticket.type)}
                        </Badge>
                      </div>

                      {/* Title */}
                      <div className="flex items-center gap-2">
                        <span
                          className="font-semibold cursor-pointer hover:text-primary transition-colors"
                          onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                        >
                          {ticket.title}
                        </span>
                        <button
                          onClick={(e) => copyTitle(ticket.title, ticket.id, e)}
                          className="text-muted-foreground hover:text-primary p-1 rounded hover:bg-accent shrink-0"
                        >
                          {copiedTicketId === ticket.id ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-muted-foreground mt-1">
                        Erstellt am {formatDateDE(ticket.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => setDeletingTicketId(ticket.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Beschreibung</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {ticket.description}
                        </p>
                      </div>

                      {ticket.screenshot_urls?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">
                            Screenshots ({ticket.screenshot_urls.length})
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {ticket.screenshot_urls.map((url: string, i: number) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="aspect-video rounded-lg overflow-hidden border hover:border-primary transition-colors"
                              >
                                <img
                                  src={url || "/placeholder.svg"}
                                  alt={`Screenshot ${i + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {ticket.steps_to_reproduce && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Schritte zum Reproduzieren</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {ticket.steps_to_reproduce}
                          </p>
                        </div>
                      )}

                      {ticket.expected_behavior && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Erwartetes Verhalten</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {ticket.expected_behavior}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Collapsed description */}
                  {!isExpanded && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{ticket.description}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ReportBugDialog open={showReportDialog} onOpenChange={setShowReportDialog} />

      <AlertDialog open={!!deletingTicketId} onOpenChange={(open) => !open && setDeletingTicketId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ticket löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie dieses Ticket wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
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

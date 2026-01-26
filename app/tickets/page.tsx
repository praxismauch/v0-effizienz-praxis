"use client"

import type React from "react"

import { useState, useEffect } from "react"
import AppLayout from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bug,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  ChevronDown,
  Search,
  Filter,
  X,
  Copy,
  Check,
  Pencil,
  Trash2,
} from "lucide-react"
import { formatDateDE } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  getPriorityIcon,
  getTypeColor,
  getTypeLabel,
  statusesToOptions,
  prioritiesToOptions,
} from "@/lib/tickets/utils"

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
    const handleTicketCreated = () => {
      fetchTickets()
    }
    window.addEventListener("ticketCreated", handleTicketCreated)
    return () => window.removeEventListener("ticketCreated", handleTicketCreated)
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [activeTab])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeTab !== "all") {
        params.append("status", activeTab)
      }

      const response = await fetch(`/api/tickets?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedTickets = tickets
    .filter((ticket) => {
      let passesTabFilter = true
      if (activeTab === "all") passesTabFilter = true
      else if (activeTab === "open") passesTabFilter = ticket.status === "open" || ticket.status === "in_progress"
      else if (activeTab === "resolved") passesTabFilter = ticket.status === "resolved" || ticket.status === "closed"
      else passesTabFilter = ticket.status === activeTab

      const passesSearchFilter =
        searchQuery === "" ||
        ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.created_by_name?.toLowerCase().includes(searchQuery.toLowerCase())

      const passesPriorityFilter = filterPriority === "all" || ticket.priority === filterPriority

      const passesTypeFilter = filterType === "all" || ticket.type === filterType

      return passesTabFilter && passesSearchFilter && passesPriorityFilter && passesTypeFilter
    })
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortOrder === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortOrder === "priority") {
        const priorityOrder = ["low", "medium", "high", "urgent"]
        return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
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
        setTickets((prevTickets) => prevTickets.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)))
        toast({
          title: "Status aktualisiert",
          description: `Ticket-Status wurde auf "${getStatusLabel(newStatus)}" geändert.`,
        })
      } else {
        toast({
          title: "Fehler",
          description: "Der Status konnte nicht aktualisiert werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error updating ticket status:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten.",
        variant: "destructive",
      })
    }
  }

  const handlePriorityChange = async (ticketId: string, newPriority: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      })

      if (response.ok) {
        setTickets((prevTickets) => prevTickets.map((t) => (t.id === ticketId ? { ...t, priority: newPriority } : t)))
        toast({
          title: "Priorität aktualisiert",
          description: `Ticket-Priorität wurde auf "${getPriorityLabel(newPriority)}" geändert.`,
        })
      } else {
        toast({
          title: "Fehler",
          description: "Die Priorität konnte nicht aktualisiert werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error updating ticket priority:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (ticketId: string) => {
    setDeletingTicketId(ticketId)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTicketId) return

    const deletedTicketId = deletingTicketId

    setTickets((prevTickets) => prevTickets.filter((t) => t.id !== deletedTicketId))

    if (expandedTicketId === deletedTicketId) {
      setExpandedTicketId(null)
    }

    setDeletingTicketId(null)

    try {
      const response = await fetch(`/api/tickets/${deletedTicketId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] Delete failed:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        })

        await fetchTickets()

        toast({
          title: "Fehler",
          description: errorData.error || "Das Ticket konnte nicht gelöscht werden.",
          variant: "destructive",
        })

        if (response.status === 403) {
          toast({
            title: "Keine Berechtigung",
            description: "Sie haben keine Berechtigung, dieses Ticket zu löschen.",
            variant: "destructive",
          })
        }
        return
      }

      toast({
        title: "Ticket gelöscht",
        description: "Das Ticket wurde erfolgreich gelöscht.",
      })
    } catch (error) {
      console.error("[v0] Error deleting ticket:", error)
      await fetchTickets()
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    }
  }

  const copyTicketTitle = async (title: string, ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent expanding the ticket
    try {
      await navigator.clipboard.writeText(title)
      setCopiedTicketId(ticketId)
      setTimeout(() => setCopiedTicketId(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
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
            <TabsTrigger value="open">
              Offen ({tickets.filter((t) => t.status === "open" || t.status === "in_progress").length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Gelöst ({tickets.filter((t) => t.status === "resolved" || t.status === "closed").length})
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 space-y-4">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Button onClick={() => setShowReportDialog(true)} className="whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                Neues Ticket
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Alle Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Typ</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Alle Typen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Typen</SelectItem>
                    {types?.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Priorität</label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Alle Prioritäten" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Prioritäten</SelectItem>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Sortierung</label>
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
            </div>
          </div>

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {loading || configLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Tickets werden geladen...</p>
              </div>
            ) : filteredAndSortedTickets.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bug className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    {searchQuery || filterPriority !== "all" || filterType !== "all"
                      ? "Keine Tickets gefunden"
                      : "Keine Tickets vorhanden"}
                  </p>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || filterPriority !== "all" || filterType !== "all"
                      ? "Versuchen Sie, Ihre Filter anzupassen oder die Suche zu ändern"
                      : "Sie haben noch keine Support-Anfragen erstellt"}
                  </p>
                  {searchQuery || filterPriority !== "all" || filterType !== "all" ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("")
                        setFilterPriority("all")
                        setFilterType("all")
                      }}
                    >
                      Filter zurücksetzen
                    </Button>
                  ) : (
                    <Button onClick={() => setShowReportDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Erstes Ticket erstellen
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredAndSortedTickets.map((ticket) => {
                  console.log("[v0] Rendering ticket card with dropdowns:", ticket.id, ticket.priority, ticket.status)
                  return (
                    <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {/* Priority Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={`${getPriorityColor(ticket.priority)} h-7 px-3 gap-1.5 font-medium cursor-pointer shadow-sm`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="text-sm font-semibold">{getPriorityIcon(ticket.priority)}</span>
                                    {getPriorityLabel(ticket.priority)}
                                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="z-[9999] min-w-[160px]">
                                  {priorityOptions.map((option) => (
                                    <DropdownMenuItem
                                      key={option.value}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handlePriorityChange(ticket.id, option.value)
                                      }}
                                      className={ticket.priority === option.value ? "bg-accent font-medium" : ""}
                                    >
                                      <span className="text-sm font-semibold mr-2">
                                        {getPriorityIcon(option.value)}
                                      </span>
                                      {option.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>

                              {/* Status Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className={`${getStatusColor(ticket.status)} h-7 px-3 gap-1.5 font-medium border-0 cursor-pointer shadow-sm`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {getStatusLabel(ticket.status)}
                                    <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="z-[9999] min-w-[180px]">
                                  {statusOptions.map((option) => (
                                    <DropdownMenuItem
                                      key={option.value}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStatusChange(ticket.id, option.value)
                                      }}
                                      className={ticket.status === option.value ? "bg-accent font-medium" : ""}
                                    >
                                      <span
                                        className={`w-2.5 h-2.5 rounded-full mr-2 ${getStatusColor(option.value).split(" ")[0]}`}
                                      />
                                      {option.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>

                              {/* Type Badge (not a dropdown) */}
                              <Badge className={getTypeColor(ticket.type)}>{getTypeLabel(ticket.type)}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xl font-semibold flex-1 select-text cursor-text hover:text-primary transition-colors"
                                style={{ userSelect: "text" }}
                              >
                                {ticket.title}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                                className="text-primary hover:underline hover:bg-transparent px-2"
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                              <button
                                onClick={(e) => copyTicketTitle(ticket.title, ticket.id, e)}
                                className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-accent"
                                title="Kopieren"
                              >
                                {copiedTicketId === ticket.id ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteClick(ticket.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive"
                                title="Löschen"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <CardDescription className="mt-2">
                              {ticket.created_by_name && <>Von: {ticket.created_by_name} • </>}
                              Erstellt am {formatDateDE(ticket.created_at)}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {expandedTicketId === ticket.id ? (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Beschreibung</h4>
                              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                {ticket.description}
                              </div>
                            </div>

                            {ticket.screenshot_urls && ticket.screenshot_urls.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-3">
                                  Screenshots ({ticket.screenshot_urls.length})
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {ticket.screenshot_urls.map((url: string, index: number) => (
                                    <a
                                      key={index}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="group relative aspect-video rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                                    >
                                      <img
                                        src={url || "/placeholder.svg"}
                                        alt={`Screenshot ${index + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {ticket.steps_to_reproduce && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Schritte zum Reproduzieren</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                  {ticket.steps_to_reproduce}
                                </p>
                              </div>
                            )}

                            {ticket.expected_behavior && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Erwartetes Verhalten</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                  {ticket.expected_behavior}
                                </p>
                              </div>
                            )}

                            {ticket.actual_behavior && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Tatsächliches Verhalten</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                  {ticket.actual_behavior}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm pt-2 border-t">
                              {ticket.status === "open" && (
                                <div className="flex items-center gap-2 text-blue-600">
                                  <Clock className="h-4 w-4" />
                                  <span>Warten auf Bearbeitung</span>
                                </div>
                              )}
                              {ticket.status === "in_progress" && (
                                <div className="flex items-center gap-2 text-yellow-600">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>Wird bearbeitet</span>
                                </div>
                              )}
                              {ticket.status === "resolved" && (
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Gelöst am {formatDateDE(ticket.updated_at)}</span>
                                </div>
                              )}
                              {ticket.status === "closed" && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Geschlossen</span>
                                </div>
                              )}
                              {ticket.status === "wont_fix" && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <XCircle className="h-4 w-4" />
                                  <span>Wird nicht behoben</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap line-clamp-2">
                              {ticket.description}
                            </p>

                            {ticket.screenshot_urls && ticket.screenshot_urls.length > 0 && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                <Bug className="h-4 w-4" />
                                <span>{ticket.screenshot_urls.length} Screenshot(s) angehängt</span>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm">
                              {ticket.status === "open" && (
                                <div className="flex items-center gap-2 text-blue-600">
                                  <Clock className="h-4 w-4" />
                                  <span>Warten auf Bearbeitung</span>
                                </div>
                              )}
                              {ticket.status === "in_progress" && (
                                <div className="flex items-center gap-2 text-yellow-600">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>Wird bearbeitet</span>
                                </div>
                              )}
                              {ticket.status === "resolved" && (
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Gelöst am {formatDateDE(ticket.updated_at)}</span>
                                </div>
                              )}
                              {ticket.status === "closed" && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Geschlossen</span>
                                </div>
                              )}
                              {ticket.status === "wont_fix" && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <XCircle className="h-4 w-4" />
                                  <span>Wird nicht behoben</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
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
    </AppLayout>
  )
}

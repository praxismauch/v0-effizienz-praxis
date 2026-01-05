"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Trash2,
  Tag,
} from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { useTicketStatuses, useTicketPriorities } from "@/lib/tickets/hooks"

interface TicketDetailProps {
  ticketId: string
}

interface TicketData {
  id: string
  title: string
  description: string | null
  type: string
  priority: string
  status: string
  user_email: string | null
  user_name: string | null
  practice_id: string | null
  assigned_to: string | null
  category: string | null
  screenshot_urls: string[] | null
  attachments: any[] | null
  steps_to_reproduce: string | null
  expected_behavior: string | null
  actual_behavior: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  metadata: Record<string, any> | null
  comments?: CommentData[]
}

interface CommentData {
  id: string
  ticket_id: string
  user_id: string | null
  comment: string
  is_internal: boolean
  created_at: string
}

export default function SuperAdminTicketDetail({ ticketId }: TicketDetailProps) {
  const router = useRouter()
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isInternal, setIsInternal] = useState(false)

  useEffect(() => {
    fetchTicketDetail()
  }, [ticketId])

  const fetchTicketDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tickets/${ticketId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Laden des Tickets")
      }

      const data = await response.json()
      setTicket(data.ticket)
    } catch (error) {
      console.error("[v0] Error loading ticket:", error)
      toast.error(error instanceof Error ? error.message : "Ticket konnte nicht geladen werden")
      router.push("/super-admin/tickets")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Aktualisieren")
      }

      const data = await response.json()
      setTicket(data.ticket)
      toast.success("Status erfolgreich aktualisiert")
    } catch (error) {
      console.error("[v0] Error updating status:", error)
      toast.error(error instanceof Error ? error.message : "Status konnte nicht aktualisiert werden")
    } finally {
      setUpdating(false)
    }
  }

  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Aktualisieren")
      }

      const data = await response.json()
      setTicket(data.ticket)
      toast.success("Priorität erfolgreich aktualisiert")
    } catch (error) {
      console.error("[v0] Error updating priority:", error)
      toast.error(error instanceof Error ? error.message : "Priorität konnte nicht aktualisiert werden")
    } finally {
      setUpdating(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Bitte geben Sie einen Kommentar ein")
      return
    }

    try {
      setUpdating(true)
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: newComment,
          is_internal: isInternal,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Hinzufügen des Kommentars")
      }

      setNewComment("")
      await fetchTicketDetail()
      toast.success("Kommentar hinzugefügt")
    } catch (error) {
      console.error("[v0] Error adding comment:", error)
      toast.error(error instanceof Error ? error.message : "Kommentar konnte nicht hinzugefügt werden")
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Möchten Sie dieses Ticket wirklich löschen?")) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Löschen")
      }

      toast.success("Ticket erfolgreich gelöscht")
      router.push("/super-admin/tickets")
    } catch (error) {
      console.error("[v0] Error deleting ticket:", error)
      toast.error(error instanceof Error ? error.message : "Ticket konnte nicht gelöscht werden")
    } finally {
      setUpdating(false)
    }
  }

  const { data: statuses = [], isLoading: statusesLoading } = useTicketStatuses()
  const { data: priorities = [], isLoading: prioritiesLoading } = useTicketPriorities()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="text-muted-foreground">Ticket wird geladen...</p>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Ticket nicht gefunden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/super-admin/tickets")}>Zurück zur Übersicht</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusOption = statuses.find((s) => s.value === ticket.status)
  const priorityOption = priorities.find((p) => p.value === ticket.priority)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/super-admin/tickets")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ticket.title}</h1>
            <p className="text-sm text-muted-foreground">Ticket #{ticket.id.slice(0, 8)}</p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={updating}>
          <Trash2 className="h-4 w-4 mr-2" />
          Löschen
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Beschreibung</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description || "Keine Beschreibung vorhanden"}</p>
            </CardContent>
          </Card>

          {/* Bug Details */}
          {(ticket.steps_to_reproduce || ticket.expected_behavior || ticket.actual_behavior) && (
            <Card>
              <CardHeader>
                <CardTitle>Bug-Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket.steps_to_reproduce && (
                  <div>
                    <Label className="font-semibold">Schritte zur Reproduktion</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{ticket.steps_to_reproduce}</p>
                  </div>
                )}
                {ticket.expected_behavior && (
                  <div>
                    <Label className="font-semibold">Erwartetes Verhalten</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{ticket.expected_behavior}</p>
                  </div>
                )}
                {ticket.actual_behavior && (
                  <div>
                    <Label className="font-semibold">Tatsächliches Verhalten</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{ticket.actual_behavior}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Screenshots */}
          {ticket.screenshot_urls && ticket.screenshot_urls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Screenshots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {ticket.screenshot_urls.map((url, index) => (
                    <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url || "/placeholder.svg"} alt={`Screenshot ${index + 1}`} className="rounded border" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Kommentare ({ticket.comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {comment.user_id ? `User ${comment.user_id.slice(0, 8)}` : "Anonym"}
                      </span>
                      <div className="flex items-center gap-2">
                        {comment.is_internal && <Badge variant="secondary">Intern</Badge>}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Noch keine Kommentare</p>
              )}

              <Separator />

              {/* Add Comment */}
              <div className="space-y-4">
                <Label>Neuer Kommentar</Label>
                <Textarea
                  placeholder="Kommentar hinzufügen..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded"
                    />
                    Als interner Kommentar markieren
                  </label>
                  <Button onClick={handleAddComment} disabled={updating || !newComment.trim()}>
                    Kommentar hinzufügen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Priorität</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={ticket.status} onValueChange={handleStatusChange} disabled={updating || statusesLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${option.color_class}`} />
                          {option.label_de}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priorität</Label>
                <Select
                  value={ticket.priority}
                  onValueChange={handlePriorityChange}
                  disabled={updating || prioritiesLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${option.color_class}`} />
                          {option.label_de}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Meta Information */}
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Typ:</span>
                <span className="capitalize">{ticket.type}</span>
              </div>

              {ticket.user_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Erstellt von:</span>
                  <span>{ticket.user_name}</span>
                </div>
              )}

              {ticket.user_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">E-Mail:</span>
                  <span className="break-all">{ticket.user_email}</span>
                </div>
              )}

              {ticket.practice_id && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Praxis-ID:</span>
                  <span className="font-mono text-xs">{ticket.practice_id.slice(0, 8)}</span>
                </div>
              )}

              <Separator />

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Erstellt:</span>
                <span>{format(new Date(ticket.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Aktualisiert:</span>
                <span>{format(new Date(ticket.updated_at), "dd.MM.yyyy HH:mm", { locale: de })}</span>
              </div>

              {ticket.resolved_at && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Gelöst:</span>
                  <span>{format(new Date(ticket.resolved_at), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

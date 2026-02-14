"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2, ShieldAlert, Loader2, Sparkles } from "lucide-react"
import { getPriorityColor, getStatusColor, getTypeColor, getTypeLabel } from "@/lib/tickets/utils"
import type { TicketItem } from "./ticket-types"

interface TicketCardProps {
  ticket: TicketItem
  statuses: { value: string; label_de: string; color?: string }[]
  priorities: { value: string; label_de: string; color?: string }[]
  types: { value: string; label_de: string }[]
  onUpdateStatus: (ticketId: string, updates: any) => void
  onEdit: (ticketId: string, values: any) => Promise<void>
  onDelete: (ticketId: string) => void
  onShowDetails: (ticket: TicketItem) => void
  onGenerateAiAction: (ticket: TicketItem) => void
  aiActionLoading: string | null
}

export function TicketCard({
  ticket,
  statuses,
  priorities,
  types,
  onUpdateStatus,
  onEdit,
  onDelete,
  onShowDetails,
  onGenerateAiAction,
  aiActionLoading,
}: TicketCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedValues, setEditedValues] = useState<any>({})

  const startEditing = () => {
    setIsEditing(true)
    setEditedValues({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      type: ticket.type,
    })
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditedValues({})
  }

  const saveEditing = async () => {
    await onEdit(ticket.id, editedValues)
    setIsEditing(false)
    setEditedValues({})
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
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
                <Select value={editedValues.priority} onValueChange={(v) => setEditedValues({ ...editedValues, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => <SelectItem key={p.value} value={p.value}>{p.label_de}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Typ</Label>
                <Select value={editedValues.type} onValueChange={(v) => setEditedValues({ ...editedValues, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label_de}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={cancelEditing}>Abbrechen</Button>
              <Button size="sm" onClick={saveEditing}>Speichern</Button>
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
                <span>-</span>
                <span>{new Date(ticket.created_at).toLocaleDateString("de-DE")}</span>
                {ticket.screenshot_urls && ticket.screenshot_urls.length > 0 && (
                  <>
                    <span>-</span>
                    <span>{ticket.screenshot_urls.length} Screenshot(s)</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGenerateAiAction(ticket)}
                disabled={aiActionLoading === ticket.id}
                className="text-primary border-primary/30 hover:bg-primary/5"
              >
                {aiActionLoading === ticket.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                v0 Aktion
              </Button>
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="h-4 w-4 mr-1" />
                Bearbeiten
              </Button>
              <Button variant="outline" size="sm" onClick={() => onShowDetails(ticket)}>
                Details
              </Button>
              <Select value={ticket.status} onValueChange={(v) => onUpdateStatus(ticket.id, { status: v })}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label_de}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(ticket.id)}
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
}

"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Sparkles } from "lucide-react"
import { getPriorityColor, getStatusColor, getTypeColor, getTypeLabel, formatDateDE } from "@/lib/tickets/utils"
import type { TicketItem } from "./ticket-types"

interface TicketDetailDialogProps {
  ticket: TicketItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  statuses: { value: string; label_de: string; color?: string }[]
  priorities: { value: string; label_de: string; color?: string }[]
  types: { value: string; label_de: string }[]
  onGenerateAiAction: (ticket: TicketItem) => void
  aiActionLoading: string | null
}

export function TicketDetailDialog({
  ticket,
  open,
  onOpenChange,
  statuses,
  priorities,
  types,
  onGenerateAiAction,
  aiActionLoading,
}: TicketDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ticket Details</DialogTitle>
          <DialogDescription>Vollständige Ticket-Informationen</DialogDescription>
        </DialogHeader>
        {ticket && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Titel</Label>
              <p className="mt-1 text-sm">{ticket.title}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Beschreibung</Label>
              <p className="mt-1 text-sm whitespace-pre-wrap">{ticket.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <Badge className={`mt-1 ${getStatusColor(ticket.status, statuses)}`}>{ticket.status}</Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Priorität</Label>
                <Badge className={`mt-1 ${getPriorityColor(ticket.priority, priorities)}`}>{ticket.priority}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Typ</Label>
                <Badge className={`mt-1 ${getTypeColor(ticket.type)}`}>{getTypeLabel(ticket.type, types)}</Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Erstellt am</Label>
                <p className="mt-1 text-sm">{formatDateDE(ticket.created_at)}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Erstellt von</Label>
              <p className="mt-1 text-sm">{ticket.user_name || ticket.user_email}</p>
            </div>
            {ticket.screenshot_urls && ticket.screenshot_urls.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Screenshots</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {ticket.screenshot_urls.map((url, index) => (
                    <img key={index} src={url || "/placeholder.svg"} alt={`Screenshot ${index + 1}`} className="rounded border w-full h-auto" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Schließen</Button>
          {ticket && (
            <Button onClick={() => onGenerateAiAction(ticket)} disabled={aiActionLoading === ticket.id} className="gap-2">
              {aiActionLoading === ticket.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              v0 Aktion generieren
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

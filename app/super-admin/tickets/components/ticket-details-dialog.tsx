"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Building, Mail, Calendar } from "lucide-react"
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  getTypeLabel,
  formatDateDE,
} from "@/lib/tickets/utils"
import type { TicketItem } from "../types"

interface TicketDetailsDialogProps {
  ticket: TicketItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TicketDetailsDialog({ ticket, open, onOpenChange }: TicketDetailsDialogProps) {
  if (!ticket) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{ticket.title}</DialogTitle>
          <DialogDescription>
            Ticket-Details und Informationen
          </DialogDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge className={getPriorityColor(ticket.priority)}>{getPriorityLabel(ticket.priority)}</Badge>
            <Badge variant="outline">{getTypeLabel(ticket.type)}</Badge>
            <Badge className={getStatusColor(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* User Info */}
          <div className="grid grid-cols-2 gap-4">
            {ticket.user_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Nutzer:</span>
                <span>{ticket.user_name}</span>
              </div>
            )}
            {ticket.practice_name && (
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Praxis:</span>
                <span>{ticket.practice_name}</span>
              </div>
            )}
            {ticket.user_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">E-Mail:</span>
                <span>{ticket.user_email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Erstellt:</span>
              <span>{formatDateDE(ticket.created_at)}</span>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h4 className="font-semibold mb-2">Beschreibung</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Bug Details */}
          {ticket.type === "bug" && (
            <>
              {ticket.steps_to_reproduce && (
                <div>
                  <h4 className="font-semibold mb-2">Schritte zur Reproduktion</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.steps_to_reproduce}</p>
                </div>
              )}
              {ticket.expected_behavior && (
                <div>
                  <h4 className="font-semibold mb-2">Erwartetes Verhalten</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.expected_behavior}</p>
                </div>
              )}
              {ticket.actual_behavior && (
                <div>
                  <h4 className="font-semibold mb-2">Tatsächliches Verhalten</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.actual_behavior}</p>
                </div>
              )}
            </>
          )}

          {/* Screenshots */}
          {ticket.screenshot_urls && ticket.screenshot_urls.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Screenshots</h4>
              <div className="grid grid-cols-2 gap-2">
                {ticket.screenshot_urls.map((url, index) => (
                  <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block">
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`Screenshot ${index + 1}`}
                      className="rounded-lg border w-full h-32 object-cover hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

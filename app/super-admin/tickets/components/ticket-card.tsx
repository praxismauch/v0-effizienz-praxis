"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bug,
  MessageSquare,
  ChevronDown,
  User,
  Building,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Archive,
  Trash2,
  ImageIcon,
} from "lucide-react"
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  getTypeLabel,
  formatDateDE,
} from "@/lib/tickets/utils"
import type { TicketItem } from "../types"

interface TicketCardProps {
  ticket: TicketItem
  onViewDetails: (ticket: TicketItem) => void
  onStatusChange: (ticketId: string, status: string) => void
  onDelete: (ticketId: string) => void
}

export function TicketCard({ ticket, onViewDetails, onStatusChange, onDelete }: TicketCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <Bug className="h-4 w-4" />
      case "feature_request":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={getPriorityColor(ticket.priority)}>{getPriorityLabel(ticket.priority)}</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                {getTypeIcon(ticket.type)}
                {getTypeLabel(ticket.type)}
              </Badge>
              <Badge className={getStatusColor(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
            </div>

            <h3
              className="font-semibold text-lg mb-1 cursor-pointer hover:text-primary truncate"
              onClick={() => onViewDetails(ticket)}
            >
              {ticket.title}
            </h3>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{ticket.description}</p>

            {/* Screenshot Thumbnails */}
            {ticket.screenshot_urls && ticket.screenshot_urls.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  {ticket.screenshot_urls.slice(0, 3).map((url, index) => (
                    <div
                      key={index}
                      className="relative w-16 h-12 rounded-md overflow-hidden border border-border bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onViewDetails(ticket)}
                    >
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {ticket.screenshot_urls.length > 3 && (
                    <div
                      className="flex items-center justify-center w-16 h-12 rounded-md border border-border bg-muted text-xs text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => onViewDetails(ticket)}
                    >
                      +{ticket.screenshot_urls.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  {ticket.screenshot_urls.length} {ticket.screenshot_urls.length === 1 ? "Screenshot" : "Screenshots"}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {ticket.user_name && (
                <div className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  <span>{ticket.user_name}</span>
                </div>
              )}
              {ticket.practice_name && (
                <div className="flex items-center gap-1">
                  <Building className="h-3.5 w-3.5" />
                  <span>{ticket.practice_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDateDE(ticket.created_at)}</span>
              </div>
              {ticket.messages_count && ticket.messages_count > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{ticket.messages_count}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="bg-transparent" onClick={() => onViewDetails(ticket)}>
              <Eye className="h-4 w-4 mr-1" />
              Details
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-transparent">
                  Status
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Status ändern</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onStatusChange(ticket.id, "open")}>
                  <MessageSquare className="h-4 w-4 mr-2 text-orange-500" />
                  Offen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(ticket.id, "in_progress")}>
                  <PlayCircle className="h-4 w-4 mr-2 text-blue-500" />
                  In Bearbeitung
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(ticket.id, "resolved")}>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Gelöst
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(ticket.id, "closed")}>
                  <Archive className="h-4 w-4 mr-2 text-gray-500" />
                  Geschlossen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(ticket.id, "wont_fix")}>
                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                  Wird nicht behoben
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(ticket.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

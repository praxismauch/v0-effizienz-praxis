"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Copy, Check, Pencil, Trash2, Bug } from "lucide-react"
import { formatDateDE } from "@/lib/utils"
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  getPriorityIcon,
  getTypeLabel,
} from "@/lib/tickets/utils"
import { TicketStatusIndicator } from "./ticket-status-indicator"

interface FilterOption {
  value: string
  label: string
}

interface TicketCardProps {
  ticket: any
  isExpanded: boolean
  isCopied: boolean
  statusOptions: FilterOption[]
  priorityOptions: FilterOption[]
  onToggleExpand: () => void
  onStatusChange: (ticketId: string, newStatus: string) => void
  onPriorityChange: (ticketId: string, newPriority: string) => void
  onDelete: (ticketId: string) => void
  onCopyTitle: (title: string, ticketId: string, e: React.MouseEvent) => void
}

export function TicketCard({
  ticket,
  isExpanded,
  isCopied,
  statusOptions,
  priorityOptions,
  onToggleExpand,
  onStatusChange,
  onPriorityChange,
  onDelete,
  onCopyTitle,
}: TicketCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
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
                    className={`${getPriorityColor(ticket.priority)} text-white border-0 hover:opacity-90 h-7 px-3 gap-1.5 font-medium shadow-sm cursor-pointer`}
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
                      onClick={(e) => { e.stopPropagation(); onPriorityChange(ticket.id, option.value) }}
                      className={ticket.priority === option.value ? "bg-accent font-medium" : ""}
                    >
                      <span className="text-sm font-semibold mr-2">{getPriorityIcon(option.value)}</span>
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`${getStatusColor(ticket.status)} text-white border-0 hover:opacity-90 h-7 px-3 gap-1.5 font-medium shadow-sm cursor-pointer`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {getStatusLabel(ticket.status)}
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="z-[9999] min-w-[180px]">
                  {statusOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={(e) => { e.stopPropagation(); onStatusChange(ticket.id, option.value) }}
                      className={ticket.status === option.value ? "bg-accent font-medium" : ""}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full mr-2 ${getStatusColor(option.value).split(" ")[0]}`} />
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Badge variant="outline" className="flex items-center gap-1">
                {getTypeLabel(ticket.type)}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold flex-1 select-text cursor-text hover:text-primary transition-colors" style={{ userSelect: "text" }}>
                {ticket.title}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="text-primary hover:underline hover:bg-transparent px-2"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Details
              </Button>
              <button onClick={(e) => onCopyTitle(ticket.title, ticket.id, e)} className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-accent" title="Kopieren">
                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
              <button onClick={() => onDelete(ticket.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive" title="Löschen">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <CardDescription className="mt-2">
              {ticket.created_by_name && <>Von: {ticket.created_by_name} {" • "}</>}
              Erstellt am {formatDateDE(ticket.created_at)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isExpanded ? (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Beschreibung</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </div>
            </div>

            {ticket.screenshot_urls && ticket.screenshot_urls.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3">Screenshots ({ticket.screenshot_urls.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ticket.screenshot_urls.map((url: string, index: number) => (
                    <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="group relative aspect-video rounded-lg overflow-hidden border border-border hover:border-primary transition-colors">
                      <img src={url || "/placeholder.svg"} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {ticket.steps_to_reproduce && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Schritte zum Reproduzieren</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{ticket.steps_to_reproduce}</p>
              </div>
            )}

            {ticket.expected_behavior && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Erwartetes Verhalten</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{ticket.expected_behavior}</p>
              </div>
            )}

            {ticket.actual_behavior && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Tatsächliches Verhalten</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{ticket.actual_behavior}</p>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm pt-4 border-t">
              <TicketStatusIndicator status={ticket.status} updatedAt={ticket.updated_at} />
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
              <TicketStatusIndicator status={ticket.status} updatedAt={ticket.updated_at} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

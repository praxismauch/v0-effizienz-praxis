"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface TicketFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  ticketStatus: string
  onStatusChange: (status: string) => void
  ticketType: string
  onTypeChange: (type: string) => void
  ticketPriority: string
  onPriorityChange: (priority: string) => void
  statuses: { value: string; label_de: string }[]
  types: { value: string; label_de: string }[]
  priorities: { value: string; label_de: string }[]
}

export function TicketFilterBar({
  searchQuery,
  onSearchChange,
  ticketStatus,
  onStatusChange,
  ticketType,
  onTypeChange,
  ticketPriority,
  onPriorityChange,
  statuses,
  types,
  priorities,
}: TicketFilterBarProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Suche</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ticket durchsuchen..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={ticketStatus} onValueChange={onStatusChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label_de}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Typ</Label>
            <Select value={ticketType} onValueChange={onTypeChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                {types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label_de}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priorität</Label>
            <Select value={ticketPriority} onValueChange={onPriorityChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                {priorities.map((p) => <SelectItem key={p.value} value={p.value}>{p.label_de}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

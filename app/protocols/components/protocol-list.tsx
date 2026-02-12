"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Clock, FileText, MoreHorizontal, Edit, Trash2, Users } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"

interface Protocol {
  id: string
  title: string
  description?: string
  content?: string
  category: string
  status: "draft" | "published" | "archived"
  steps?: any[]
  action_items?: any[]
  protocol_date?: string
  created_at: string
  updated_at: string
  created_by?: string
  attendees?: string[]
}

interface ProtocolListProps {
  protocols: Protocol[]
  loading: boolean
  viewMode: "list" | "grid"
  searchQuery: string
  categoryFilter: string
  onEdit: (protocol: Protocol) => void
  onDelete: (protocol: Protocol) => void
}

export function ProtocolList({
  protocols,
  loading,
  viewMode,
  searchQuery,
  categoryFilter,
  onEdit,
  onDelete,
}: ProtocolListProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    )
  }

  if (protocols.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Keine Protokolle gefunden</h3>
          <p className="text-muted-foreground text-center mt-2">
            {searchQuery || categoryFilter !== "all"
              ? "Passen Sie Ihre Suchkriterien an"
              : "Erstellen Sie Ihr erstes Protokoll"}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {protocols.map((protocol) => (
          <Card key={protocol.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{protocol.title}</CardTitle>
                  <CardDescription>{protocol.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={protocol.status === "published" ? "default" : "secondary"}>
                    {protocol.status === "published" ? "Veröffentlicht" : "Entwurf"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(protocol)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(protocol)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="outline">{protocol.category}</Badge>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(protocol.created_at), "dd.MM.yyyy", { locale: de })}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {protocol.steps?.length || 0} Schritte
                </div>
                {(protocol as any).attendees?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {(protocol as any).attendees.length} Teilnehmer
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {protocols.map((protocol) => (
        <Card
          key={protocol.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onEdit(protocol)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{protocol.title}</CardTitle>
                <CardDescription>{protocol.description}</CardDescription>
              </div>
              <Badge variant={protocol.status === "published" ? "default" : "secondary"}>
                {protocol.status === "published" ? "Live" : "Entwurf"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(protocol.created_at), "dd.MM.yyyy", { locale: de })}
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {protocol.steps?.length || 0} Schritte
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

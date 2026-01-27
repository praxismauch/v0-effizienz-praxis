"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, LinkIcon, MapPin, Edit, Trash2 } from "lucide-react"
import type { TrainingEvent } from "../types"

interface EventsTabProps {
  events: TrainingEvent[]
  onCreateNew: () => void
  onEdit: (event: TrainingEvent) => void
  onDelete: (id: string, name: string) => void
}

export function EventsTab({ events, onCreateNew, onEdit, onDelete }: EventsTabProps) {
  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Neues Event
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Keine Events gefunden</p>
            <p className="text-sm text-muted-foreground mb-4">Planen Sie Ihre erste Schulungsveranstaltung</p>
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Event erstellen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Event
        </Button>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${event.is_online ? "bg-blue-100" : "bg-green-100"}`}>
                  {event.is_online ? (
                    <LinkIcon className="h-6 w-6 text-blue-600" />
                  ) : (
                    <MapPin className="h-6 w-6 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.start_date && new Date(event.start_date).toLocaleDateString("de-DE")}
                    {event.start_time && ` um ${event.start_time}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.location || event.meeting_link || "Kein Ort angegeben"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant={
                    event.status === "abgeschlossen"
                      ? "default"
                      : event.status === "abgesagt"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {event.status || "Geplant"}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive bg-transparent"
                    onClick={() => onDelete(event.id, event.title)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

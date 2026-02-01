"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Calendar, Clock, CheckCircle2, Circle, CalendarPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCalendar } from "@/contexts/calendar-context"
import { toast } from "sonner"

export interface CandidateEvent {
  id: string
  type: 'interview_1' | 'interview_2' | 'trial_day_1' | 'trial_day_2' | 'other'
  date: string
  time?: string
  notes?: string
  completed: boolean
  created_at: string
}

const EVENT_TYPES = [
  { value: 'interview_1', label: '1. Bewerbungsgespräch' },
  { value: 'interview_2', label: '2. Bewerbungsgespräch' },
  { value: 'trial_day_1', label: '1. Tag Probearbeiten' },
  { value: 'trial_day_2', label: '2. Tag Probearbeiten' },
  { value: 'other', label: 'Sonstiges' },
] as const

interface CandidateEventsManagerProps {
  events: CandidateEvent[]
  onChange: (events: CandidateEvent[]) => void
  candidateName?: string
}

export function CandidateEventsManager({ events, onChange, candidateName }: CandidateEventsManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newEvent, setNewEvent] = useState<Partial<CandidateEvent>>({
    type: 'interview_1',
    date: '',
    time: '',
    notes: '',
    completed: false,
  })
  const { addEvent: addCalendarEvent } = useCalendar()

  const handleAddEvent = () => {
    if (!newEvent.date || !newEvent.type) return

    const event: CandidateEvent = {
      id: crypto.randomUUID(),
      type: newEvent.type as CandidateEvent['type'],
      date: newEvent.date,
      time: newEvent.time || undefined,
      notes: newEvent.notes || undefined,
      completed: newEvent.completed || false,
      created_at: new Date().toISOString(),
    }

    onChange([...events, event])
    setNewEvent({
      type: 'interview_1',
      date: '',
      time: '',
      notes: '',
      completed: false,
    })
    setIsAdding(false)
  }

  const handleRemoveEvent = (eventId: string) => {
    onChange(events.filter(e => e.id !== eventId))
  }

  const handleAddToCalendar = async (event: CandidateEvent) => {
    try {
      const typeLabel = getEventTypeLabel(event.type)
      const title = candidateName 
        ? `${typeLabel}: ${candidateName}`
        : typeLabel

      await addCalendarEvent({
        title,
        description: event.notes || `Kandidaten-Termin: ${typeLabel}`,
        startDate: event.date,
        endDate: event.date,
        startTime: event.time || '09:00',
        endTime: event.time 
          ? `${String(parseInt(event.time.split(':')[0]) + 1).padStart(2, '0')}:${event.time.split(':')[1]}`
          : '10:00',
        type: event.type.includes('interview') ? 'interview' : 'meeting',
        priority: 'medium',
        visibility: 'private',
        isAllDay: false,
      })
      
      toast.success('Termin zum Kalender hinzugefügt')
    } catch (error) {
      toast.error('Fehler beim Hinzufügen zum Kalender')
    }
  }

  const handleToggleCompleted = (eventId: string) => {
    onChange(events.map(e => 
      e.id === eventId ? { ...e, completed: !e.completed } : e
    ))
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const getEventTypeLabel = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type)?.label || type
  }

  const getEventTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'interview_1':
      case 'interview_2':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'trial_day_1':
      case 'trial_day_2':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Termine & Ereignisse</Label>
        {!isAdding && (
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAdding(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Termin hinzufügen
          </Button>
        )}
      </div>

      {/* List of existing events */}
      {sortedEvents.length > 0 && (
        <div className="space-y-2">
          {sortedEvents.map((event) => (
            <Card key={event.id} className={cn(
              "transition-colors",
              event.completed && "bg-muted/50"
            )}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleCompleted(event.id)}
                      className="mt-0.5 shrink-0"
                    >
                      {event.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className={cn("shrink-0", getEventTypeBadgeColor(event.type))}
                        >
                          {getEventTypeLabel(event.type)}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className={cn(event.completed && "line-through")}>
                            {formatDate(event.date)}
                          </span>
                        </div>
                        {event.time && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span className={cn(event.completed && "line-through")}>
                              {event.time} Uhr
                            </span>
                          </div>
                        )}
                      </div>
                      {event.notes && (
                        <p className={cn(
                          "text-sm text-muted-foreground mt-1 truncate",
                          event.completed && "line-through"
                        )}>
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!event.completed && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 text-muted-foreground hover:text-blue-600"
                        onClick={() => handleAddToCalendar(event)}
                        title="Zum Kalender hinzufügen"
                      >
                        <CalendarPlus className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add new event form */}
      {isAdding && (
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Art des Termins *</Label>
                <Select 
                  value={newEvent.type} 
                  onValueChange={(value) => setNewEvent({ ...newEvent, type: value as CandidateEvent['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Terminart wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Datum *</Label>
                <Input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Uhrzeit (optional)</Label>
                <Input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="completed"
                    checked={newEvent.completed}
                    onCheckedChange={(checked) => setNewEvent({ ...newEvent, completed: checked as boolean })}
                  />
                  <Label htmlFor="completed" className="text-sm font-normal cursor-pointer">
                    Bereits abgeschlossen
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notizen (optional)</Label>
              <Textarea
                value={newEvent.notes}
                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                placeholder="z.B. Raum, Teilnehmer, Vorbereitung..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAdding(false)}
              >
                Abbrechen
              </Button>
              <Button 
                type="button" 
                onClick={handleAddEvent}
                disabled={!newEvent.date || !newEvent.type}
              >
                Termin hinzufügen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {events.length === 0 && !isAdding && (
        <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
          Noch keine Termine erfasst
        </div>
      )}
    </div>
  )
}

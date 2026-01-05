"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Calendar, Clock, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { usePractice } from "@/contexts/practice-context"
import { useCalendar } from "@/contexts/calendar-context"
import { formatDateDE, formatTimeDE } from "@/lib/utils"

export function AICalendarAssistantDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [suggestions, setSuggestions] = useState<any>(null)
  const { currentPractice } = usePractice()
  const { addEvent } = useCalendar()

  const generateSuggestions = async () => {
    if (!currentPractice || !prompt.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/calendar/ai-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const data = await response.json()
      setSuggestions(data)
    } catch (error) {
      console.error("Error generating suggestions:", error)
    } finally {
      setLoading(false)
    }
  }

  const acceptSuggestion = (event: any) => {
    addEvent(event)
    setOpen(false)
    setSuggestions(null)
    setPrompt("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 text-white shadow-md hover:shadow-lg hover:from-purple-600/90 hover:to-indigo-600/90 transition-all duration-200">
          <Sparkles className="h-4 w-4" />
          KI-Terminassistent
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Terminassistent
          </DialogTitle>
          <DialogDescription>
            Beschreiben Sie Ihren Terminwunsch und die KI schlägt optimale Zeiten vor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Textarea
              placeholder="z.B. 'Team-Meeting nächste Woche für 2 Stunden' oder 'Wartungstermin für Geräte im April'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>

          <Button onClick={generateSuggestions} disabled={loading || !prompt.trim()} className="w-full">
            {loading ? "Generiere Vorschläge..." : "Vorschläge generieren"}
          </Button>

          {suggestions && suggestions.events && (
            <div className="space-y-3">
              <h4 className="font-medium">Vorgeschlagene Termine:</h4>
              {suggestions.events.map((event: any, index: number) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">{event.title}</h5>
                        <Button size="sm" onClick={() => acceptSuggestion(event)}>
                          Hinzufügen
                        </Button>
                      </div>
                      {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateDE(event.startDate)}
                        </div>
                        {!event.isAllDay && event.startTime && event.endTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeDE(event.startTime)} - {formatTimeDE(event.endTime)} Uhr
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {suggestions.reasoning && <p className="text-sm text-muted-foreground italic">{suggestions.reasoning}</p>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AICalendarAssistantDialog

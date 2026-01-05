"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Calendar, Copy, Check, ExternalLink, Info, Plus, Trash2, Download, Upload } from "lucide-react"
import { useUser } from "@/contexts/user-context"

interface CalendarSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ExternalCalendar {
  id: string
  name: string
  ical_url: string
  color: string
  is_active: boolean
  last_synced_at: string | null
  sync_status: string
}

export function CalendarSubscriptionDialog({ open, onOpenChange }: CalendarSubscriptionDialogProps) {
  const { currentPractice } = useUser()
  const [copied, setCopied] = useState(false)
  const [subscriptionToken, setSubscriptionToken] = useState<string>("")
  const [generating, setGenerating] = useState(false)

  // External calendar state
  const [externalCalendars, setExternalCalendars] = useState<ExternalCalendar[]>([])
  const [showAddExternal, setShowAddExternal] = useState(false)
  const [newExternalName, setNewExternalName] = useState("")
  const [newExternalUrl, setNewExternalUrl] = useState("")
  const [newExternalColor, setNewExternalColor] = useState("#3b82f6")
  const [loadingExternal, setLoadingExternal] = useState(false)

  // Load external calendars when dialog opens
  const loadExternalCalendars = async () => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/calendar/external-subscriptions`)
      if (response.ok) {
        const data = await response.json()
        setExternalCalendars(data.subscriptions || [])
      }
    } catch (error) {
      console.error("Error loading external calendars:", error)
    }
  }

  useEffect(() => {
    if (open && currentPractice?.id) {
      loadExternalCalendars()
    }
  }, [open, currentPractice?.id])

  const generateSubscriptionLink = async () => {
    if (!currentPractice?.id) {
      toast.error("Keine Praxis ausgewählt")
      return
    }

    console.log("[v0] Generating subscription link for practice:", currentPractice.id)
    setGenerating(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/calendar/subscription-token`, {
        method: "POST",
      })

      console.log("[v0] Subscription token API response:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Subscription token generated:", data.token)
        setSubscriptionToken(data.token)
        toast.success("Kalender-Abonnement-Link erstellt")
      } else {
        const errorData = await response.json()
        console.error("[v0] Error generating subscription link:", errorData)
        toast.error("Fehler beim Erstellen des Links")
      }
    } catch (error) {
      console.error("[v0] Error generating subscription link:", error)
      toast.error("Fehler beim Erstellen des Links")
    } finally {
      setGenerating(false)
    }
  }

  const addExternalCalendar = async () => {
    if (!newExternalName || !newExternalUrl) {
      toast.error("Bitte füllen Sie alle Felder aus")
      return
    }

    setLoadingExternal(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice?.id}/calendar/external-subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newExternalName,
          ical_url: newExternalUrl,
          color: newExternalColor,
        }),
      })

      if (response.ok) {
        toast.success("Externer Kalender hinzugefügt")
        setNewExternalName("")
        setNewExternalUrl("")
        setNewExternalColor("#3b82f6")
        setShowAddExternal(false)
        loadExternalCalendars()
      } else {
        toast.error("Fehler beim Hinzufügen des Kalenders")
      }
    } catch (error) {
      console.error("Error adding external calendar:", error)
      toast.error("Fehler beim Hinzufügen des Kalenders")
    } finally {
      setLoadingExternal(false)
    }
  }

  const deleteExternalCalendar = async (id: string) => {
    try {
      const response = await fetch(`/api/practices/${currentPractice?.id}/calendar/external-subscriptions/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Externer Kalender gelöscht")
        loadExternalCalendars()
      } else {
        toast.error("Fehler beim Löschen")
      }
    } catch (error) {
      console.error("Error deleting external calendar:", error)
      toast.error("Fehler beim Löschen")
    }
  }

  const getSubscriptionUrl = () => {
    if (!subscriptionToken || !currentPractice) return ""
    const baseUrl = window.location.origin
    return `${baseUrl}/api/practices/${currentPractice.id}/calendar/ical?token=${subscriptionToken}`
  }

  const copyToClipboard = async () => {
    const url = getSubscriptionUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link in Zwischenablage kopiert")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Fehler beim Kopieren")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Kalenderabonnement (iCal Sync)
          </DialogTitle>
          <DialogDescription>
            Synchronisieren Sie Kalender mit externen Apps oder importieren Sie externe Kalender
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* SECTION 1: Export App Calendar (Outbound Sync) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">1. Kalender exportieren</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Synchronisieren Sie Ihren Praxis-Kalender mit externen Kalender-Apps (Apple Kalender, Google Kalender,
              Outlook, etc.)
            </p>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Mit dem Kalenderabonnement können Sie Ihre Termine automatisch in Ihrer bevorzugten Kalender-App
                anzeigen lassen. Die Synchronisation erfolgt automatisch.
              </AlertDescription>
            </Alert>

            {!subscriptionToken ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Abonnement-Link erstellen</Label>
                  <p className="text-sm text-muted-foreground">
                    Generieren Sie einen eindeutigen Link für Ihr Kalenderabonnement.
                  </p>
                </div>
                <Button onClick={generateSubscriptionLink} disabled={generating} className="w-full">
                  {generating ? "Erstelle Link..." : "Kalender-Abonnement-Link generieren"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Abonnement-URL</Label>
                  <div className="flex gap-2">
                    <Input value={getSubscriptionUrl()} readOnly className="font-mono text-xs" />
                    <Button onClick={copyToClipboard} variant="outline" size="icon">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2 rounded-lg border p-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Apple Kalender
                    </h4>
                    <p className="text-xs text-muted-foreground">Datei → Neues Kalenderabonnement → URL einfügen</p>
                  </div>

                  <div className="space-y-2 rounded-lg border p-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Google Kalender
                    </h4>
                    <p className="text-xs text-muted-foreground">+ neben "Weitere Kalender" → Per URL</p>
                  </div>

                  <div className="space-y-2 rounded-lg border p-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Outlook
                    </h4>
                    <p className="text-xs text-muted-foreground">Datei → Kontoeinstellungen → Internetkalender</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSubscriptionToken("")
                      toast.info("Abonnement-Link zurückgezogen")
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Link zurückziehen
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* SECTION 2: Import External Calendars (Inbound Sync) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">2. Externe Kalender importieren</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Fügen Sie externe iCal-Kalender hinzu, um sie in der App anzuzeigen (nur Ansicht, keine Bearbeitung)
            </p>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Importierte Kalender werden regelmäßig synchronisiert und sind nur zur Ansicht verfügbar. Sie können
                keine Termine in importierten Kalendern bearbeiten.
              </AlertDescription>
            </Alert>

            {/* List of external calendars */}
            {externalCalendars.length > 0 && (
              <div className="space-y-2">
                {externalCalendars.map((calendar) => (
                  <div key={calendar.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: calendar.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{calendar.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{calendar.ical_url}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteExternalCalendar(calendar.id)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new external calendar */}
            {showAddExternal ? (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="space-y-2">
                  <Label>Kalendername</Label>
                  <Input
                    placeholder="z.B. Privater Kalender"
                    value={newExternalName}
                    onChange={(e) => setNewExternalName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>iCal URL</Label>
                  <Input
                    placeholder="https://..."
                    value={newExternalUrl}
                    onChange={(e) => setNewExternalUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Farbe</Label>
                  <Input
                    type="color"
                    value={newExternalColor}
                    onChange={(e) => setNewExternalColor(e.target.value)}
                    className="h-10 w-20"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addExternalCalendar} disabled={loadingExternal} size="sm">
                    {loadingExternal ? "Wird hinzugefügt..." : "Hinzufügen"}
                  </Button>
                  <Button onClick={() => setShowAddExternal(false)} variant="outline" size="sm">
                    Abbrechen
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowAddExternal(true)} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Externen Kalender hinzufügen
              </Button>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Fertig</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CalendarSubscriptionDialog

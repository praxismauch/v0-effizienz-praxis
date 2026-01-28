"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"

interface CalendarSettings {
  defaultView: string
  weekStart: string
  workStart: string
  workEnd: string
  defaultDuration: string
  showWeekends: boolean
  showHolidays: boolean
}

export function CalendarSettingsTab() {
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<CalendarSettings>({
    defaultView: "week",
    weekStart: "monday",
    workStart: "08:00",
    workEnd: "18:00",
    defaultDuration: "30",
    showWeekends: false,
    showHolidays: true,
  })

  useEffect(() => {
    const loadSettings = async () => {
      if (!currentPractice?.id) return
      
      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/settings/calendar`)
        if (response.ok) {
          const data = await response.json()
          if (data) {
            setSettings({
              defaultView: data.defaultView || "week",
              weekStart: data.weekStart || "monday",
              workStart: data.workStart || "08:00",
              workEnd: data.workEnd || "18:00",
              defaultDuration: data.defaultDuration || "30",
              showWeekends: data.showWeekends !== false,
              showHolidays: data.showHolidays !== false,
            })
          }
        }
      } catch (error) {
        console.error("Error loading calendar settings:", error)
      }
    }
    
    loadSettings()
  }, [currentPractice?.id])

  const handleSave = async () => {
    if (!currentPractice?.id) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/settings/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: "Erfolgreich gespeichert",
          description: "Die Kalender-Einstellungen wurden gespeichert.",
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Kalender-Einstellungen
          </CardTitle>
          <CardDescription>Konfigurieren Sie die Kalenderansicht und Standardeinstellungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Standard-Ansicht</Label>
              <Select
                value={settings.defaultView}
                onValueChange={(value) => setSettings({ ...settings, defaultView: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ansicht auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Tagesansicht</SelectItem>
                  <SelectItem value="week">Wochenansicht</SelectItem>
                  <SelectItem value="month">Monatsansicht</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Woche beginnt am</Label>
              <Select
                value={settings.weekStart}
                onValueChange={(value) =>                 setSettings({ ...settings, weekStart: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tag auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Montag</SelectItem>
                  <SelectItem value="sunday">Sonntag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Arbeitsbeginn</Label>
              <Select
                value={settings.workStart}
                onValueChange={(value) =>                 setSettings({ ...settings, workStart: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Uhrzeit auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="06:00">06:00 Uhr</SelectItem>
                  <SelectItem value="07:00">07:00 Uhr</SelectItem>
                  <SelectItem value="08:00">08:00 Uhr</SelectItem>
                  <SelectItem value="09:00">09:00 Uhr</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Arbeitsende</Label>
              <Select
                value={settings.workEnd}
                onValueChange={(value) =>                 setSettings({ ...settings, workEnd: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Uhrzeit auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:00">16:00 Uhr</SelectItem>
                  <SelectItem value="17:00">17:00 Uhr</SelectItem>
                  <SelectItem value="18:00">18:00 Uhr</SelectItem>
                  <SelectItem value="19:00">19:00 Uhr</SelectItem>
                  <SelectItem value="20:00">20:00 Uhr</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Standard-Termindauer</Label>
              <Select
                value={settings.defaultDuration}
                onValueChange={(value) =>                 setSettings({ ...settings, defaultDuration: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Dauer auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 Minuten</SelectItem>
                  <SelectItem value="30">30 Minuten</SelectItem>
                  <SelectItem value="45">45 Minuten</SelectItem>
                  <SelectItem value="60">60 Minuten</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Wochenenden anzeigen</Label>
                <p className="text-sm text-muted-foreground">Samstag und Sonntag im Kalender anzeigen</p>
              </div>
              <Switch
                checked={settings.showWeekends}
                onCheckedChange={(checked) =>                 setSettings({ ...settings, showWeekends: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Feiertage anzeigen</Label>
                <p className="text-sm text-muted-foreground">Deutsche Feiertage im Kalender markieren</p>
              </div>
              <Switch
                checked={settings.showHolidays}
                onCheckedChange={(checked) =>                 setSettings({ ...settings, showHolidays: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Speichert...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Kalender-Einstellungen speichern
          </>
        )}
      </Button>
    </div>
  )
}

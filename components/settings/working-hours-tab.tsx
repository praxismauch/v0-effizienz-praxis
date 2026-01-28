"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Clock, Coins, Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"

interface WorkingHoursSettings {
  hours_per_week: number
  days_per_week: number
  vacation_days: number
  flex_time_enabled: boolean
  overtime_limit: number
  break_duration: number
  track_breaks: boolean
}

export function WorkingHoursTab() {
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<WorkingHoursSettings>({
    hours_per_week: 40,
    days_per_week: 5,
    vacation_days: 30,
    flex_time_enabled: false,
    overtime_limit: 20,
    break_duration: 30,
    track_breaks: true,
  })

  useEffect(() => {
    const loadSettings = async () => {
      if (!currentPractice?.id) return
      
      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/settings/working-hours`)
        if (response.ok) {
          const data = await response.json()
          if (data) {
            setSettings({
              hours_per_week: data.hours_per_week || 40,
              days_per_week: data.days_per_week || 5,
              vacation_days: data.vacation_days || 30,
              flex_time_enabled: data.flex_time_enabled || false,
              overtime_limit: data.overtime_limit || 20,
              break_duration: data.break_duration || 30,
              track_breaks: data.track_breaks !== false,
            })
          }
        }
      } catch (error) {
        console.error("Error loading working hours settings:", error)
      }
    }
    
    loadSettings()
  }, [currentPractice?.id])

  const handleSave = async () => {
    if (!currentPractice?.id) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/settings/working-hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: "Erfolgreich gespeichert",
          description: "Die Arbeitszeit-Einstellungen wurden gespeichert.",
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
            <Clock className="h-5 w-5" />
            Arbeitszeit-Einstellungen
          </CardTitle>
          <CardDescription>Konfigurieren Sie die Standard-Arbeitszeiten für Ihr Team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hours-per-week">Wochenstunden</Label>
              <Input
                id="hours-per-week"
                type="number"
                value={settings.hours_per_week}
                onChange={(e) => setSettings({ ...settings, hours_per_week: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="days-per-week">Arbeitstage pro Woche</Label>
              <Input
                id="days-per-week"
                type="number"
                value={settings.days_per_week}
                onChange={(e) => setSettings({ ...settings, days_per_week: Number(e.target.value) })}
              />
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vacation-days">Urlaubstage pro Jahr</Label>
              <Input
                id="vacation-days"
                type="number"
                value={settings.vacation_days}
                onChange={(e) => setSettings({ ...settings, vacation_days: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="break-duration">Pausendauer (Minuten)</Label>
              <Input
                id="break-duration"
                type="number"
                value={settings.break_duration}
                onChange={(e) => setSettings({ ...settings, break_duration: Number(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Überstunden & Flexzeit
          </CardTitle>
          <CardDescription>Konfigurieren Sie die Überstunden-Regelungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Flexzeit aktivieren</Label>
              <p className="text-sm text-muted-foreground">Erlaubt flexible Arbeitszeiten innerhalb der Kernarbeitszeit</p>
            </div>
            <Switch
              checked={settings.flex_time_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, flex_time_enabled: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Pausen erfassen</Label>
              <p className="text-sm text-muted-foreground">Erfassen Sie Pausen separat in der Zeiterfassung</p>
            </div>
            <Switch
              checked={settings.track_breaks}
              onCheckedChange={(checked) => setSettings({ ...settings, track_breaks: checked })}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="overtime-limit">Maximale Überstunden pro Monat</Label>
            <Input
              id="overtime-limit"
              type="number"
              value={settings.overtime_limit}
              onChange={(e) => setSettings({ ...settings, overtime_limit: Number(e.target.value) })}
              className="max-w-xs"
            />
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
            Arbeitszeit-Einstellungen speichern
          </>
        )}
      </Button>
    </div>
  )
}

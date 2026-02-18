"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePractice } from "@/contexts/practice-context"
import { toast } from "sonner"
import { Clock, Save, Loader2, AlertTriangle, Timer } from "lucide-react"

interface TimeTrackingSettings {
  auto_stop_enabled: boolean
  auto_stop_hours: number
}

const DEFAULT_SETTINGS: TimeTrackingSettings = {
  auto_stop_enabled: true,
  auto_stop_hours: 12,
}

const HOUR_OPTIONS = [
  { value: 8, label: "8 Stunden" },
  { value: 10, label: "10 Stunden" },
  { value: 12, label: "12 Stunden" },
  { value: 14, label: "14 Stunden" },
  { value: 16, label: "16 Stunden" },
  { value: 24, label: "24 Stunden" },
]

export function TimeTrackingSettingsTab() {
  const { currentPractice } = usePractice()
  const [settings, setSettings] = useState<TimeTrackingSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [savedSettings, setSavedSettings] = useState<TimeTrackingSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    if (currentPractice?.id) {
      fetchSettings()
    }
  }, [currentPractice?.id])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/practices/${currentPractice!.id}/settings/time-tracking`)
      if (res.ok) {
        const data = await res.json()
        const s = { ...DEFAULT_SETTINGS, ...data.settings }
        setSettings(s)
        setSavedSettings(s)
      }
    } catch (error) {
      console.error("Error fetching time tracking settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/practices/${currentPractice!.id}/settings/time-tracking`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })

      if (!res.ok) throw new Error("Failed to save")

      setSavedSettings(settings)
      setHasChanges(false)
      toast.success("Zeiterfassungs-Einstellungen gespeichert")
    } catch (error) {
      console.error("Error saving time tracking settings:", error)
      toast.error("Fehler beim Speichern der Einstellungen")
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (updates: Partial<TimeTrackingSettings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    setHasChanges(
      newSettings.auto_stop_enabled !== savedSettings.auto_stop_enabled ||
      newSettings.auto_stop_hours !== savedSettings.auto_stop_hours
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Timer className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Zeiterfassung</CardTitle>
              <CardDescription>
                Einstellungen zur automatischen Zeiterfassung und Stempeluhr
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-Stop Section */}
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <Label className="text-base font-medium">Automatisches Ausstempeln</Label>
                  <p className="text-sm text-muted-foreground">
                    Vergessene Stempelungen werden nach der eingestellten Zeit automatisch beendet
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.auto_stop_enabled}
                onCheckedChange={(checked) => updateSettings({ auto_stop_enabled: checked })}
              />
            </div>

            {settings.auto_stop_enabled && (
              <div className="ml-8 space-y-4 pt-2 border-t">
                <div className="flex items-center gap-4">
                  <Label className="min-w-[180px]">Maximale Stempeldauer</Label>
                  <Select
                    value={String(settings.auto_stop_hours)}
                    onValueChange={(val) => updateSettings({ auto_stop_hours: Number(val) })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOUR_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">So funktioniert es:</p>
                      <ul className="mt-1 space-y-1 list-disc list-inside text-amber-700 dark:text-amber-300">
                        <li>
                          Offene Zeitblöcke die älter als {settings.auto_stop_hours} Stunden sind werden automatisch geschlossen
                        </li>
                        <li>
                          Die Endzeit wird auf {settings.auto_stop_hours} Stunden nach Beginn gesetzt
                        </li>
                        <li>
                          Betroffene Einträge werden als <Badge variant="outline" className="text-xs mx-1">Automatisch gestoppt</Badge> markiert
                        </li>
                        <li>
                          Die Prüfung erfolgt bei jedem Aufruf der Zeiterfassungsseite
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Speichern
        </Button>
      </div>
    </div>
  )
}

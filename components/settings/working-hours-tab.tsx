"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Clock, Coins, Loader2, Save } from "lucide-react"

interface WorkingHoursSettings {
  hours_per_week: number
  days_per_week: number
  vacation_days: number
  flex_time_enabled: boolean
  overtime_limit: number
  break_duration: number
  track_breaks: boolean
}

interface WorkingHoursTabProps {
  settings: WorkingHoursSettings
  onChange: (settings: WorkingHoursSettings) => void
  onSave: () => void
  saving: boolean
}

export function WorkingHoursTab({ settings, onChange, onSave, saving }: WorkingHoursTabProps) {
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
                onChange={(e) => onChange({ ...settings, hours_per_week: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="days-per-week">Arbeitstage pro Woche</Label>
              <Input
                id="days-per-week"
                type="number"
                value={settings.days_per_week}
                onChange={(e) => onChange({ ...settings, days_per_week: Number(e.target.value) })}
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
                onChange={(e) => onChange({ ...settings, vacation_days: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="break-duration">Pausendauer (Minuten)</Label>
              <Input
                id="break-duration"
                type="number"
                value={settings.break_duration}
                onChange={(e) => onChange({ ...settings, break_duration: Number(e.target.value) })}
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
              onCheckedChange={(checked) => onChange({ ...settings, flex_time_enabled: checked })}
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
              onCheckedChange={(checked) => onChange({ ...settings, track_breaks: checked })}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="overtime-limit">Maximale Überstunden pro Monat</Label>
            <Input
              id="overtime-limit"
              type="number"
              value={settings.overtime_limit}
              onChange={(e) => onChange({ ...settings, overtime_limit: Number(e.target.value) })}
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={onSave} disabled={saving}>
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

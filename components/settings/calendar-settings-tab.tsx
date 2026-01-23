"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Loader2, Save } from "lucide-react"
import type { CalendarSettings } from "@/app/settings/types"

interface CalendarSettingsTabProps {
  settings: CalendarSettings
  onChange: (settings: CalendarSettings) => void
  onSave: () => void
  saving: boolean
}

export function CalendarSettingsTab({ settings, onChange, onSave, saving }: CalendarSettingsTabProps) {
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
                onValueChange={(value) => onChange({ ...settings, defaultView: value })}
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
                onValueChange={(value) => onChange({ ...settings, weekStart: value })}
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
                onValueChange={(value) => onChange({ ...settings, workStart: value })}
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
                onValueChange={(value) => onChange({ ...settings, workEnd: value })}
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
                onValueChange={(value) => onChange({ ...settings, defaultDuration: value })}
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
                onCheckedChange={(checked) => onChange({ ...settings, showWeekends: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Feiertage anzeigen</Label>
                <p className="text-sm text-muted-foreground">Deutsche Feiertage im Kalender markieren</p>
              </div>
              <Switch
                checked={settings.showHolidays}
                onCheckedChange={(checked) => onChange({ ...settings, showHolidays: checked })}
              />
            </div>
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
            Kalender-Einstellungen speichern
          </>
        )}
      </Button>
    </div>
  )
}

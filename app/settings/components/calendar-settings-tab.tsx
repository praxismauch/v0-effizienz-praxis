"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Loader2, Save, MapPin } from "lucide-react"
import { usePractice } from "@/contexts/practice-context"
import type { CalendarSettings } from "../types"

const BUNDESLAND_CODE_MAP: Record<string, string> = {
  "Baden-Württemberg": "BW",
  "Bayern": "BY",
  "Berlin": "BE",
  "Brandenburg": "BB",
  "Bremen": "HB",
  "Hamburg": "HH",
  "Hessen": "HE",
  "Mecklenburg-Vorpommern": "MV",
  "Niedersachsen": "NI",
  "Nordrhein-Westfalen": "NW",
  "Rheinland-Pfalz": "RP",
  "Saarland": "SL",
  "Sachsen": "SN",
  "Sachsen-Anhalt": "ST",
  "Schleswig-Holstein": "SH",
  "Thüringen": "TH",
}

interface CalendarSettingsTabProps {
  settings: CalendarSettings
  onSettingsChange: (settings: CalendarSettings) => void
  onSave: () => Promise<void>
  saving: boolean
}

export function CalendarSettingsTab({ settings, onSettingsChange, onSave, saving }: CalendarSettingsTabProps) {
  const { currentPractice } = usePractice()
  const bundesland = (currentPractice as any)?.bundesland || ""
  const bundeslandCode = BUNDESLAND_CODE_MAP[bundesland] || ""
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Kalender-Einstellungen
        </CardTitle>
        <CardDescription>Passen Sie die Standardansicht und Arbeitszeiten an</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Standardansicht</Label>
            <Select
              value={settings.defaultView}
              onValueChange={(value) => onSettingsChange({ ...settings, defaultView: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Tag</SelectItem>
                <SelectItem value="week">Woche</SelectItem>
                <SelectItem value="month">Monat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Wochenstart</Label>
            <Select
              value={settings.weekStart}
              onValueChange={(value) => onSettingsChange({ ...settings, weekStart: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">Montag</SelectItem>
                <SelectItem value="sunday">Sonntag</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Arbeitsbeginn</Label>
            <Select
              value={settings.workStart}
              onValueChange={(value) => onSettingsChange({ ...settings, workStart: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, "0")
                  return (
                    <SelectItem key={hour} value={`${hour}:00`}>
                      {hour}:00
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Arbeitsende</Label>
            <Select
              value={settings.workEnd}
              onValueChange={(value) => onSettingsChange({ ...settings, workEnd: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, "0")
                  return (
                    <SelectItem key={hour} value={`${hour}:00`}>
                      {hour}:00
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Standard-Termindauer</Label>
            <Select
              value={settings.defaultDuration}
              onValueChange={(value) => onSettingsChange({ ...settings, defaultDuration: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 Minuten</SelectItem>
                <SelectItem value="30">30 Minuten</SelectItem>
                <SelectItem value="45">45 Minuten</SelectItem>
                <SelectItem value="60">60 Minuten</SelectItem>
                <SelectItem value="90">90 Minuten</SelectItem>
                <SelectItem value="120">2 Stunden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Wochenenden anzeigen</Label>
              <p className="text-sm text-muted-foreground">Samstag und Sonntag im Kalender anzeigen</p>
            </div>
            <Switch
              checked={settings.showWeekends}
              onCheckedChange={(checked) => onSettingsChange({ ...settings, showWeekends: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Feiertage anzeigen</Label>
              <p className="text-sm text-muted-foreground">Deutsche Feiertage im Kalender markieren</p>
            </div>
            <Switch
              checked={settings.showHolidays}
              onCheckedChange={(checked) => onSettingsChange({ ...settings, showHolidays: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label>Landesspezifische Feiertage</Label>
                {bundesland ? (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <MapPin className="h-3 w-3" />
                    {bundesland}
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {bundesland
                  ? `Feiertage für ${bundesland} zusätzlich anzeigen (z.B. Fronleichnam, Allerheiligen)`
                  : "Bitte zuerst ein Bundesland in den Praxis-Einstellungen festlegen"}
              </p>
            </div>
            <Switch
              checked={settings.showBundeslandHolidays ?? true}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, showBundeslandHolidays: checked })
              }
              disabled={!bundesland}
            />
          </div>
        </div>

        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Speichern
        </Button>
      </CardContent>
    </Card>
  )
}

export default CalendarSettingsTab

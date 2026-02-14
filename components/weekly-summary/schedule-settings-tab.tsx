"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Clock, Sparkles } from "lucide-react"
import type { WeeklySummarySettings } from "./types"
import { DAYS_OF_WEEK } from "./types"

interface ScheduleSettingsTabProps {
  settings: WeeklySummarySettings
  onUpdate: (key: keyof WeeklySummarySettings, value: any) => void
}

export function ScheduleSettingsTab({ settings, onUpdate }: ScheduleSettingsTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Versandzeitpunkt
          </CardTitle>
          <CardDescription>Wann soll die wöchentliche Zusammenfassung gesendet werden?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Wochentag</Label>
              <Select
                value={settings.send_day.toString()}
                onValueChange={(v) => onUpdate("send_day", Number.parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Uhrzeit</Label>
              <Input
                type="time"
                value={settings.send_time}
                onChange={(e) => onUpdate("send_time", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Zeitzone</Label>
              <Select value={settings.timezone} onValueChange={(v) => onUpdate("timezone", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Berlin">Europe/Berlin (MEZ)</SelectItem>
                  <SelectItem value="Europe/Vienna">Europe/Vienna (MEZ)</SelectItem>
                  <SelectItem value="Europe/Zurich">Europe/Zurich (MEZ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Anpassung
          </CardTitle>
          <CardDescription>Personalisieren Sie Ihre Zusammenfassung</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Einleitungstext (optional)</Label>
            <Textarea
              placeholder="z.B. Hier ist Ihre wöchentliche Praxis-Übersicht..."
              value={settings.custom_intro}
              onChange={(e) => onUpdate("custom_intro", e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Abschlusstext (optional)</Label>
            <Textarea
              placeholder="z.B. Bei Fragen wenden Sie sich an..."
              value={settings.custom_footer}
              onChange={(e) => onUpdate("custom_footer", e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label>Markenfarbe</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={settings.branding_color}
                  onChange={(e) => onUpdate("branding_color", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.branding_color}
                  onChange={(e) => onUpdate("branding_color", e.target.value)}
                  className="w-28"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch
                checked={settings.include_logo}
                onCheckedChange={(checked) => onUpdate("include_logo", checked)}
              />
              <Label>Praxis-Logo einbinden</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

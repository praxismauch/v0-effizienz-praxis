"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Bell, Loader2, Save } from "lucide-react"
import type { NotificationSettings } from "@/app/settings/types"

interface NotificationsTabProps {
  settings: NotificationSettings
  onChange: (settings: NotificationSettings) => void
  onSave: () => void
  saving: boolean
}

export function NotificationsTab({ settings, onChange, onSave, saving }: NotificationsTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Benachrichtigungen
          </CardTitle>
          <CardDescription>Verwalten Sie Ihre Benachrichtigungseinstellungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>E-Mail-Benachrichtigungen</Label>
              <p className="text-sm text-muted-foreground">Erhalten Sie wichtige Updates per E-Mail</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => onChange({ ...settings, emailNotifications: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Aufgaben-Erinnerungen</Label>
              <p className="text-sm text-muted-foreground">Erinnerungen für anstehende Aufgaben</p>
            </div>
            <Switch
              checked={settings.taskReminders}
              onCheckedChange={(checked) => onChange({ ...settings, taskReminders: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>E-Mail bei Fälligkeit</Label>
              <p className="text-sm text-muted-foreground">
                E-Mail erhalten, wenn eine Aufgabe ihr Fälligkeitsdatum erreicht
              </p>
            </div>
            <Switch
              checked={settings.todoDueDateEmail}
              onCheckedChange={(checked) => onChange({ ...settings, todoDueDateEmail: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Termin-Erinnerungen</Label>
              <p className="text-sm text-muted-foreground">Erinnerungen für bevorstehende Termine</p>
            </div>
            <Switch
              checked={settings.appointmentReminders}
              onCheckedChange={(checked) => onChange({ ...settings, appointmentReminders: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Wöchentlicher Bericht</Label>
              <p className="text-sm text-muted-foreground">Zusammenfassung der Wochenaktivitäten</p>
            </div>
            <Switch
              checked={settings.weeklyReport}
              onCheckedChange={(checked) => onChange({ ...settings, weeklyReport: checked })}
            />
          </div>
          <div className="pt-4">
            <Button onClick={onSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichert...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Einstellungen speichern
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

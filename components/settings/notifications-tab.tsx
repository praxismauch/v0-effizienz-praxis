"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Bell, Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import type { NotificationSettings } from "@/app/settings/types"

export function NotificationsTab() {
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    taskReminders: true,
    todoDueDateEmail: true,
    appointmentReminders: true,
    weeklyReport: false,
    marketingEmails: false,
  })

  useEffect(() => {
    if (currentUser?.notification_settings) {
      setSettings({
        emailNotifications: currentUser.notification_settings.emailNotifications ?? true,
        taskReminders: currentUser.notification_settings.taskReminders ?? true,
        todoDueDateEmail: currentUser.notification_settings.todoDueDateEmail ?? true,
        appointmentReminders: currentUser.notification_settings.appointmentReminders ?? true,
        weeklyReport: currentUser.notification_settings.weeklyReport ?? false,
        marketingEmails: currentUser.notification_settings.marketingEmails ?? false,
      })
    }
  }, [currentUser])

  const handleSave = async () => {
    if (!currentUser || !currentPractice) return

    setSaving(true)
    try {
      const response = await fetch(`/api/users/${currentUser.id}/notification-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!response.ok) throw new Error("Failed to save settings")

      toast({
        title: "Erfolg",
        description: "Benachrichtigungseinstellungen wurden gespeichert",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Benachrichtigungseinstellungen konnten nicht gespeichert werden",
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
              onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
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
              onCheckedChange={(checked) => setSettings({ ...settings, taskReminders: checked })}
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
              onCheckedChange={(checked) => setSettings({ ...settings, todoDueDateEmail: checked })}
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
              onCheckedChange={(checked) => setSettings({ ...settings, appointmentReminders: checked })}
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
              onCheckedChange={(checked) => setSettings({ ...settings, weeklyReport: checked })}
            />
          </div>
          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving}>
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

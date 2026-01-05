"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { Save } from "lucide-react"

export default function SuperAdminSettings() {
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowNewRegistrations: true,
    enableEmailNotifications: true,
    enableBackups: true,
    autoBackupInterval: 24,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: Implement settings save
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Einstellungen gespeichert",
        description: "Die Systemeinstellungen wurden erfolgreich aktualisiert.",
      })
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
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Systemeinstellungen</h1>
        <p className="text-muted-foreground">Verwalten Sie globale Systemeinstellungen</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Systemstatus</CardTitle>
          <CardDescription>Kontrollieren Sie den Status des Systems</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance">Wartungsmodus</Label>
              <p className="text-sm text-muted-foreground">
                Aktivieren Sie den Wartungsmodus für alle Benutzer außer Super Admins
              </p>
            </div>
            <Switch
              id="maintenance"
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, maintenanceMode: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="registrations">Neue Registrierungen</Label>
              <p className="text-sm text-muted-foreground">Erlauben Sie neue Benutzerregistrierungen</p>
            </div>
            <Switch
              id="registrations"
              checked={settings.allowNewRegistrations}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allowNewRegistrations: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Benachrichtigungen</CardTitle>
          <CardDescription>Konfigurieren Sie Systembenachrichtigungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">E-Mail-Benachrichtigungen</Label>
              <p className="text-sm text-muted-foreground">Senden Sie E-Mail-Benachrichtigungen an Administratoren</p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.enableEmailNotifications}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableEmailNotifications: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup & Sicherheit</CardTitle>
          <CardDescription>Konfigurieren Sie automatische Backups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="backups">Automatische Backups</Label>
              <p className="text-sm text-muted-foreground">Erstellen Sie automatische Datenbank-Backups</p>
            </div>
            <Switch
              id="backups"
              checked={settings.enableBackups}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableBackups: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Speichert..." : "Einstellungen speichern"}
        </Button>
      </div>
    </div>
  )
}

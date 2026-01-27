"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Settings } from "lucide-react"
import type { InventorySettings } from "../types"

interface SettingsTabProps {
  settings: InventorySettings
  onSettingsChange: (settings: InventorySettings) => void
  onSaveSettings: () => void
}

export function SettingsTab({ settings, onSettingsChange, onSaveSettings }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Benachrichtigungen
          </CardTitle>
          <CardDescription>Konfigurieren Sie Ihre Benachrichtigungseinstellungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>E-Mail-Benachrichtigungen</Label>
              <p className="text-sm text-muted-foreground">Erhalten Sie E-Mails bei niedrigem Bestand</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, emailNotifications: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push-Benachrichtigungen</Label>
              <p className="text-sm text-muted-foreground">Erhalten Sie Push-Benachrichtigungen</p>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, pushNotifications: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schwellenwerte</CardTitle>
          <CardDescription>Legen Sie Mindestbestände fest</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Niedriger Bestand Schwellenwert</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    lowStockThreshold: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="criticalStockThreshold">Kritischer Bestand Schwellenwert</Label>
              <Input
                id="criticalStockThreshold"
                type="number"
                value={settings.criticalStockThreshold}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    criticalStockThreshold: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automatisierung</CardTitle>
          <CardDescription>Automatische Bestellungen konfigurieren</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automatische Nachbestellung</Label>
              <p className="text-sm text-muted-foreground">
                Automatisch nachbestellen wenn unter Schwellenwert
              </p>
            </div>
            <Switch
              checked={settings.autoReorder}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, autoReorder: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSaveSettings}>Einstellungen speichern</Button>
      </div>
    </div>
  )
}

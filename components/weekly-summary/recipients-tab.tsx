"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Users, Mail, Plus, Trash2 } from "lucide-react"
import type { WeeklySummarySettings } from "./types"

interface RecipientsTabProps {
  settings: WeeklySummarySettings
  onUpdate: (key: keyof WeeklySummarySettings, value: any) => void
  onRecipientsChange: (recipients: WeeklySummarySettings["recipients"]) => void
}

export function RecipientsTab({ settings, onUpdate, onRecipientsChange }: RecipientsTabProps) {
  const [newRecipient, setNewRecipient] = useState({ email: "", name: "", role: "admin" })

  const addRecipient = () => {
    if (!newRecipient.email) return
    onRecipientsChange([...settings.recipients, { ...newRecipient }])
    setNewRecipient({ email: "", name: "", role: "admin" })
  }

  const removeRecipient = (index: number) => {
    onRecipientsChange(settings.recipients.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Automatische Empfänger</CardTitle>
          <CardDescription>Basierend auf Benutzerrollen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Praxis-Administratoren</p>
                <p className="text-sm text-muted-foreground">Alle Benutzer mit Admin-Rolle</p>
              </div>
            </div>
            <Switch
              checked={settings.send_to_admins}
              onCheckedChange={(checked) => onUpdate("send_to_admins", checked)}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Manager</p>
                <p className="text-sm text-muted-foreground">Benutzer mit Manager-Rechten</p>
              </div>
            </div>
            <Switch
              checked={settings.send_to_managers}
              onCheckedChange={(checked) => onUpdate("send_to_managers", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zusätzliche Empfänger</CardTitle>
          <CardDescription>Manuelle E-Mail-Adressen hinzufügen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="E-Mail-Adresse"
              type="email"
              value={newRecipient.email}
              onChange={(e) => setNewRecipient((prev) => ({ ...prev, email: e.target.value }))}
              className="flex-1"
            />
            <Input
              placeholder="Name (optional)"
              value={newRecipient.name}
              onChange={(e) => setNewRecipient((prev) => ({ ...prev, name: e.target.value }))}
              className="w-40"
            />
            <Button onClick={addRecipient} disabled={!newRecipient.email}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {settings.recipients.length > 0 ? (
            <div className="space-y-2">
              {settings.recipients.map((recipient, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{recipient.email}</p>
                      {recipient.name && <p className="text-xs text-muted-foreground">{recipient.name}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeRecipient(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine zusätzlichen Empfänger konfiguriert
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

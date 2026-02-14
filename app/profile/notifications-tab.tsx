"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Bell } from "lucide-react"

interface NotificationSetting {
  key: string
  label: string
  description: string
}

const notificationSettings: NotificationSetting[] = [
  { key: "emailNotifications", label: "E-Mail-Benachrichtigungen", description: "Erhalten Sie wichtige Updates per E-Mail" },
  { key: "taskReminders", label: "Aufgaben-Erinnerungen", description: "Erinnerungen fur anstehende Aufgaben" },
  { key: "teamUpdates", label: "Team-Updates", description: "Benachrichtigungen uber Team-Anderungen" },
  { key: "marketingEmails", label: "Marketing-E-Mails", description: "Produktneuheiten und Tipps" },
]

export function NotificationsTab() {
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    taskReminders: true,
    teamUpdates: true,
    marketingEmails: false,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Benachrichtigungen
        </CardTitle>
        <CardDescription>Verwalten Sie Ihre Benachrichtigungseinstellungen</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {notificationSettings.map((setting, index) => (
          <div key={setting.key}>
            {index > 0 && <Separator className="mb-6" />}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{setting.label}</Label>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <Switch
                checked={notifications[setting.key as keyof typeof notifications]}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, [setting.key]: checked }))
                }
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

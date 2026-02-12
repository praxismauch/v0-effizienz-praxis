import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Bell } from "lucide-react"

interface NotificationSettingsTabProps {
  notifications: {
    emailNotifications: boolean
    taskReminders: boolean
    teamUpdates: boolean
    marketingEmails: boolean
  }
  onNotificationChange: (key: string, value: boolean) => void
}

export function NotificationSettingsTab({ notifications, onNotificationChange }: NotificationSettingsTabProps) {
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
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>E-Mail-Benachrichtigungen</Label>
            <p className="text-sm text-muted-foreground">Erhalten Sie wichtige Updates per E-Mail</p>
          </div>
          <Switch
            checked={notifications.emailNotifications}
            onCheckedChange={(checked) => onNotificationChange("emailNotifications", checked)}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Aufgaben-Erinnerungen</Label>
            <p className="text-sm text-muted-foreground">Erinnerungen für anstehende Aufgaben</p>
          </div>
          <Switch
            checked={notifications.taskReminders}
            onCheckedChange={(checked) => onNotificationChange("taskReminders", checked)}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Team-Updates</Label>
            <p className="text-sm text-muted-foreground">Benachrichtigungen über Team-Änderungen</p>
          </div>
          <Switch checked={notifications.teamUpdates} onCheckedChange={(checked) => onNotificationChange("teamUpdates", checked)} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Marketing-E-Mails</Label>
            <p className="text-sm text-muted-foreground">Produktneuheiten und Tipps</p>
          </div>
          <Switch
            checked={notifications.marketingEmails}
            onCheckedChange={(checked) => onNotificationChange("marketingEmails", checked)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

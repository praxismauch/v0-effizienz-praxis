"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Cloud, CloudOff, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Backup, BackupSchedule } from "./types"
import { formatDateDE, formatFileSize } from "./utils"

interface GoogleDriveTabProps {
  backups: Backup[]
  schedules: BackupSchedule[]
  googleDriveConnected: boolean
  isConnectingGoogleDrive: boolean
  onConnectGoogleDrive: () => void
  onDisconnectGoogleDrive: () => void
  onSyncToGoogleDrive: (backupId: string, practiceId: string | null) => void
}

export function GoogleDriveTab({
  backups,
  schedules,
  googleDriveConnected,
  isConnectingGoogleDrive,
  onConnectGoogleDrive,
  onDisconnectGoogleDrive,
  onSyncToGoogleDrive,
}: GoogleDriveTabProps) {
  const { toast } = useToast()

  const syncedBackups = backups.filter((b) => b.google_drive_file_id)
  const unsyncedBackups = backups.filter((b) => !b.google_drive_file_id)

  const handleSyncAll = async () => {
    if (unsyncedBackups.length === 0) {
      toast({
        title: "Alle Backups synchronisiert",
        description: "Es gibt keine unsynchronisierten Backups",
      })
      return
    }

    for (const backup of unsyncedBackups) {
      await onSyncToGoogleDrive(backup.id, backup.practice_id)
    }

    toast({
      title: "Synchronisierung gestartet",
      description: `${unsyncedBackups.length} Backups werden zu Google Drive hochgeladen`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Drive Synchronisierung</CardTitle>
        <CardDescription>
          Verbinden Sie Ihr Google Drive-Konto, um Backups automatisch in der Cloud zu speichern
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {googleDriveConnected ? (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Cloud className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Google Drive verbunden</p>
                  <p className="text-sm text-muted-foreground">Backups werden automatisch synchronisiert</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <CloudOff className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">Nicht verbunden</p>
                  <p className="text-sm text-muted-foreground">Verbinden Sie Google Drive für Cloud-Backups</p>
                </div>
              </>
            )}
          </div>
          <Button
            onClick={googleDriveConnected ? onDisconnectGoogleDrive : onConnectGoogleDrive}
            disabled={isConnectingGoogleDrive}
            variant={googleDriveConnected ? "outline" : "default"}
          >
            {isConnectingGoogleDrive
              ? "Verbinde..."
              : googleDriveConnected
                ? "Verbindung trennen"
                : "Mit Google Drive verbinden"}
          </Button>
        </div>

        {/* Sync Settings */}
        {googleDriveConnected && (
          <>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Synchronisierungs-Einstellungen</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Konfigurieren Sie, wie Backups mit Google Drive synchronisiert werden sollen
                </p>
              </div>

              {/* Auto-sync toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-sync" className="text-base font-medium">
                    Automatische Synchronisierung
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Neue Backups automatisch zu Google Drive hochladen
                  </p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={schedules.some((s) => s.syncToGoogleDrive)}
                  onCheckedChange={(checked) => {
                    toast({
                      title: checked ? "Auto-Sync aktiviert" : "Auto-Sync deaktiviert",
                      description: checked
                        ? "Neue automatische Backups werden zu Google Drive hochgeladen"
                        : "Neue Backups werden nicht mehr automatisch hochgeladen",
                    })
                  }}
                />
              </div>

              {/* Folder selection */}
              <div className="space-y-2">
                <Label>Google Drive Ordner</Label>
                <div className="flex gap-2">
                  <Input value="Effizienz Praxis / Backups" disabled className="flex-1" />
                  <Button variant="outline" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Backups werden in diesem Ordner in Ihrem Google Drive gespeichert
                </p>
              </div>

              {/* Sync history */}
              <div className="space-y-2">
                <Label>Synchronisierungs-Verlauf</Label>
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Letzte Synchronisierung:</span>
                    <span className="font-medium">
                      {syncedBackups.length > 0
                        ? formatDateDE(syncedBackups[0].created_at)
                        : "Noch keine Synchronisierung"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Synchronisierte Backups:</span>
                    <span className="font-medium">
                      {syncedBackups.length} von {backups.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Verwendeter Speicher:</span>
                    <span className="font-medium">
                      {formatFileSize(syncedBackups.reduce((sum, b) => sum + (b.file_size || 0), 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sync all button */}
              <Button onClick={handleSyncAll} variant="outline" className="w-full" disabled={unsyncedBackups.length === 0}>
                <Cloud className="mr-2 h-4 w-4" />
                Alle unsynchronisierten Backups synchronisieren ({unsyncedBackups.length})
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

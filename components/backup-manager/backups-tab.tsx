"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Download,
  Plus,
  RefreshCw,
  Trash2,
  Cloud,
  CloudOff,
  Building2,
  Package,
  Loader2,
  AlertCircleIcon,
  UploadIcon,
  Check,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Database,
} from "lucide-react"
import type { Backup, BackupFormState, Practice } from "./types"
import { formatDateDE, formatFileSize, getVerificationStatus, getBackupTypeLabel } from "./utils"

interface BackupsTabProps {
  backups: Backup[]
  practices: Practice[]
  filterPractice: string
  filterType: string
  isLoading: boolean
  isCreatingBackup: boolean
  backupProgress: number
  backupProgressMessage: string
  isVerifying: string | null
  isVerifyingAll: boolean
  googleDriveConnected: boolean
  backupForm: BackupFormState
  showBackupDialog: boolean
  setShowBackupDialog: (show: boolean) => void
  setFilterPractice: (value: string) => void
  setFilterType: (value: string) => void
  setBackupForm: (form: BackupFormState) => void
  onCreateBackup: () => Promise<boolean>
  onFetchBackups: () => void
  onVerifyBackup: (id: string) => void
  onVerifyAllBackups: () => void
  onDownloadBackup: (backup: Backup) => void
  onDeleteBackup: (id: string) => void
  onSyncToGoogleDrive: (backupId: string, practiceId: string | null) => void
  onRestoreClick: (backup: Backup) => void
}

export function BackupsTab({
  backups,
  practices,
  filterPractice,
  filterType,
  isLoading,
  isCreatingBackup,
  backupProgress,
  backupProgressMessage,
  isVerifying,
  isVerifyingAll,
  googleDriveConnected,
  backupForm,
  showBackupDialog,
  setShowBackupDialog,
  setFilterPractice,
  setFilterType,
  setBackupForm,
  onCreateBackup,
  onFetchBackups,
  onVerifyBackup,
  onVerifyAllBackups,
  onDownloadBackup,
  onDeleteBackup,
  onSyncToGoogleDrive,
  onRestoreClick,
}: BackupsTabProps) {
  const handleCreateBackup = async () => {
    const success = await onCreateBackup()
    if (success) {
      setShowBackupDialog(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Backup-Verwaltung</CardTitle>
            <CardDescription>Erstellen, verwalten und wiederherstellen Sie Datenbank-Backups</CardDescription>
          </div>
          <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Neues Backup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neues Backup erstellen</DialogTitle>
                <DialogDescription>Erstellen Sie ein manuelles Backup der Datenbank</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Praxis (optional)</Label>
                  <Select
                    value={backupForm.practiceId}
                    onValueChange={(value) => setBackupForm({ ...backupForm, practiceId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alle Praxen (Vollständiges Backup)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Praxen</SelectItem>
                      {practices.map((practice) => (
                        <SelectItem key={practice.id} value={practice.id}>
                          {practice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Backup-Umfang</Label>
                  <Select
                    value={backupForm.backupScope}
                    onValueChange={(value) => setBackupForm({ ...backupForm, backupScope: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Vollständig (alle Tabellen)</SelectItem>
                      <SelectItem value="practice">Nur Praxis-Daten</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notizen (optional)</Label>
                  <Textarea
                    value={backupForm.notes}
                    onChange={(e) => setBackupForm({ ...backupForm, notes: e.target.value })}
                    placeholder="Grund für das Backup..."
                  />
                </div>

                {isCreatingBackup ? (
                  <div className="space-y-3 w-full">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Database className="h-4 w-4 animate-pulse" />
                      <span>{backupProgressMessage || "Backup wird erstellt..."}</span>
                    </div>
                    <Progress value={backupProgress} className="h-3" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{backupProgress}%</span>
                      <span>
                        {backupProgress < 100 ? "Bitte warten..." : "Abgeschlossen!"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <Button onClick={handleCreateBackup} disabled={isLoading} className="w-full">
                    Backup erstellen
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <Label>Praxis filtern</Label>
            <Select value={filterPractice} onValueChange={setFilterPractice}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Praxen</SelectItem>
                {practices.map((practice) => (
                  <SelectItem key={practice.id} value={practice.id}>
                    {practice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label>Typ filtern</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="manual">Manuell</SelectItem>
                <SelectItem value="automatic">Automatisch</SelectItem>
                <SelectItem value="scheduled">Geplant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={onFetchBackups}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Aktualisieren
            </Button>
            <Button variant="outline" onClick={onVerifyAllBackups} disabled={isVerifyingAll}>
              {isVerifyingAll ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Alle verifizieren
            </Button>
          </div>
        </div>

        {/* Backups Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Praxis</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Umfang</TableHead>
                <TableHead>Größe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verifiziert</TableHead>
                <TableHead>Google Drive</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    Keine Backups gefunden
                  </TableCell>
                </TableRow>
              ) : (
                backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="font-medium">{formatDateDE(backup.created_at)}</TableCell>
                    <TableCell>
                      {backup.practice ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {backup.practice.name}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Alle Praxen</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getBackupTypeLabel(backup.backup_type)}</Badge>
                    </TableCell>
                    <TableCell>{backup.backup_scope === "full" ? "Vollständig" : "Praxis"}</TableCell>
                    <TableCell>{formatFileSize(backup.file_size)}</TableCell>
                    <TableCell>
                      {backup.status === "completed" || backup.status === "verified" ? (
                        <Badge className="bg-green-500">
                          <Check className="mr-1 h-3 w-3" />
                          Abgeschlossen
                        </Badge>
                      ) : backup.status === "failed" ? (
                        <Badge variant="destructive">
                          <AlertCircleIcon className="mr-1 h-3 w-3" />
                          Fehlgeschlagen
                        </Badge>
                      ) : (
                        <Badge variant="secondary">In Bearbeitung</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const status = getVerificationStatus(backup)
                        const verification = backup.metadata?.verification

                        if (status === "verified") {
                          return (
                            <div className="flex items-center gap-1">
                              <Badge className="bg-emerald-500 hover:bg-emerald-600">
                                <ShieldCheck className="mr-1 h-3 w-3" />
                                OK
                              </Badge>
                              {verification?.stats && (
                                <span className="text-xs text-muted-foreground">
                                  {verification.stats.totalRows} Zeilen
                                </span>
                              )}
                            </div>
                          )
                        } else if (status === "failed") {
                          return (
                            <Badge variant="destructive">
                              <ShieldAlert className="mr-1 h-3 w-3" />
                              Fehler
                            </Badge>
                          )
                        } else {
                          return (
                            <Badge variant="outline" className="text-muted-foreground">
                              <ShieldQuestion className="mr-1 h-3 w-3" />
                              Ausstehend
                            </Badge>
                          )
                        }
                      })()}
                    </TableCell>
                    <TableCell>
                      {backup.google_drive_file_id ? (
                        <Badge variant="outline" className="gap-1">
                          <Cloud className="h-3 w-3" />
                          Synchronisiert
                        </Badge>
                      ) : googleDriveConnected ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onSyncToGoogleDrive(backup.id, backup.practice_id)}
                        >
                          <CloudOff className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onVerifyBackup(backup.id)}
                          disabled={isVerifying === backup.id}
                          title="Backup verifizieren"
                        >
                          {isVerifying === backup.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDownloadBackup(backup)}
                          title="Backup herunterladen"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRestoreClick(backup)}
                          title="Wiederherstellen"
                        >
                          <UploadIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteBackup(backup.id)}
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

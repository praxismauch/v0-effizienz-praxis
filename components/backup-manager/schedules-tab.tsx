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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, AlertTriangle, Loader2, ShieldAlert } from "lucide-react"
import type { BackupSchedule, ScheduleFormState, Practice } from "./types"
import { formatDateDE, getScheduleTypeLabel } from "./utils"

interface SchedulesTabProps {
  schedules: BackupSchedule[]
  practices: Practice[]
  practicesWithoutSchedules: Practice[]
  isLoading: boolean
  isCreatingSchedule: boolean
  isSettingUpAll: boolean
  loading: boolean
  googleDriveConnected: boolean
  scheduleForm: ScheduleFormState
  showScheduleDialog: boolean
  editingScheduleId: string | null
  setShowScheduleDialog: (show: boolean) => void
  setScheduleForm: (form: ScheduleFormState) => void
  setEditingScheduleId: (id: string | null) => void
  onCreateSchedule: () => Promise<boolean>
  onUpdateSchedule: (id: string, data: Partial<ScheduleFormState>) => Promise<boolean>
  onToggleSchedule: (scheduleId: string, isActive: boolean) => void
  onSetupAllPracticeSchedules: () => void
  onDiagnoseSchedules: () => void
  onFixStuckSchedules: () => void
}

export function SchedulesTab({
  schedules,
  practices,
  practicesWithoutSchedules,
  isLoading,
  isCreatingSchedule,
  isSettingUpAll,
  loading,
  googleDriveConnected,
  scheduleForm,
  showScheduleDialog,
  editingScheduleId,
  setShowScheduleDialog,
  setScheduleForm,
  setEditingScheduleId,
  onCreateSchedule,
  onUpdateSchedule,
  onToggleSchedule,
  onSetupAllPracticeSchedules,
  onDiagnoseSchedules,
  onFixStuckSchedules,
}: SchedulesTabProps) {
  const handleSaveSchedule = async () => {
    let success: boolean
    if (editingScheduleId) {
      success = await onUpdateSchedule(editingScheduleId, scheduleForm)
    } else {
      success = await onCreateSchedule()
    }
    if (success) {
      setShowScheduleDialog(false)
      setEditingScheduleId(null)
    }
  }

  const handleEditSchedule = (schedule: BackupSchedule) => {
    setScheduleForm({
      practiceId: schedule.practice_id || "all",
      scheduleType: schedule.schedule_type,
      backupScope: schedule.backup_scope,
      timeOfDay: schedule.time_of_day,
      dayOfWeek: schedule.day_of_week ?? 1,
      dayOfMonth: schedule.day_of_month ?? 1,
      retentionDays: schedule.retention_days,
      syncToGoogleDrive: schedule.syncToGoogleDrive ?? false,
    })
    setEditingScheduleId(schedule.id)
    setShowScheduleDialog(true)
  }

  const handleOpenCreate = () => {
    setEditingScheduleId(null)
    setScheduleForm({
      practiceId: "",
      scheduleType: "daily",
      backupScope: "full",
      timeOfDay: "02:00",
      dayOfWeek: 1,
      dayOfMonth: 1,
      retentionDays: 30,
      syncToGoogleDrive: false,
    })
    setShowScheduleDialog(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Automatische Backup-Zeitpläne</CardTitle>
            <CardDescription>
              Konfigurieren Sie automatische Backups für tägliche, wöchentliche oder monatliche Ausführung
            </CardDescription>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Zeitplan erstellen
          </Button>
          <Dialog open={showScheduleDialog} onOpenChange={(open) => {
            setShowScheduleDialog(open)
            if (!open) setEditingScheduleId(null)
          }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingScheduleId ? "Backup-Zeitplan bearbeiten" : "Neuen Backup-Zeitplan erstellen"}</DialogTitle>
                <DialogDescription>{editingScheduleId ? "Ändern Sie die Einstellungen dieses Zeitplans" : "Richten Sie automatische Backups ein"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Praxis</Label>
                    <Select
                      value={scheduleForm.practiceId}
                      onValueChange={(value) => setScheduleForm({ ...scheduleForm, practiceId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Alle Praxen" />
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
                    <Label>Häufigkeit</Label>
                    <Select
                      value={scheduleForm.scheduleType}
                      onValueChange={(value) => setScheduleForm({ ...scheduleForm, scheduleType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Täglich</SelectItem>
                        <SelectItem value="weekly">Wöchentlich</SelectItem>
                        <SelectItem value="monthly">Monatlich</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Backup-Umfang</Label>
                    <Select
                      value={scheduleForm.backupScope}
                      onValueChange={(value) => setScheduleForm({ ...scheduleForm, backupScope: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Vollständig</SelectItem>
                        <SelectItem value="practice">Nur Praxis-Daten</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Uhrzeit</Label>
                    <Input
                      type="time"
                      value={scheduleForm.timeOfDay}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, timeOfDay: e.target.value })}
                    />
                  </div>
                </div>

                {scheduleForm.scheduleType === "weekly" && (
                  <div className="space-y-2">
                    <Label>Wochentag</Label>
                    <Select
                      value={scheduleForm.dayOfWeek.toString()}
                      onValueChange={(value) => setScheduleForm({ ...scheduleForm, dayOfWeek: Number.parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Montag</SelectItem>
                        <SelectItem value="2">Dienstag</SelectItem>
                        <SelectItem value="3">Mittwoch</SelectItem>
                        <SelectItem value="4">Donnerstag</SelectItem>
                        <SelectItem value="5">Freitag</SelectItem>
                        <SelectItem value="6">Samstag</SelectItem>
                        <SelectItem value="0">Sonntag</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {scheduleForm.scheduleType === "monthly" && (
                  <div className="space-y-2">
                    <Label>Tag des Monats</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={scheduleForm.dayOfMonth}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, dayOfMonth: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Aufbewahrungsdauer (Tage)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={scheduleForm.retentionDays || 30}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value) || 30
                      setScheduleForm({ ...scheduleForm, retentionDays: value })
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Backups älter als diese Anzahl von Tagen werden automatisch gelöscht
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="syncToGoogleDrive" className="flex flex-col gap-1">
                    <span>Automatisch zu Google Drive synchronisieren</span>
                    <span className="text-xs text-muted-foreground">
                      Backups werden automatisch zu Google Drive hochgeladen
                    </span>
                  </Label>
                  <Switch
                    id="syncToGoogleDrive"
                    checked={scheduleForm.syncToGoogleDrive}
                    onCheckedChange={(checked) => setScheduleForm({ ...scheduleForm, syncToGoogleDrive: checked })}
                    disabled={!googleDriveConnected}
                  />
                </div>

                <Button onClick={handleSaveSchedule} disabled={isLoading || isCreatingSchedule} className="w-full">
                  {isCreatingSchedule
                    ? (editingScheduleId ? "Wird gespeichert..." : "Wird erstellt...")
                    : (editingScheduleId ? "Zeitplan speichern" : "Zeitplan erstellen")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {practicesWithoutSchedules.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">
                  {practicesWithoutSchedules.length} Praxis(en) ohne Backup-Zeitplan
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  Die folgenden Praxen haben noch keinen automatischen Backup-Zeitplan:{" "}
                  {practicesWithoutSchedules.map((p) => p.name).join(", ")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100 bg-transparent"
                  onClick={onSetupAllPracticeSchedules}
                  disabled={isSettingUpAll}
                >
                  {isSettingUpAll ? "Wird eingerichtet..." : "Jetzt für alle einrichten"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Diagnose and Repair Button */}
        <div className="mb-4 flex gap-2">
          <Button variant="outline" onClick={onDiagnoseSchedules} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
            )}
            Diagnose Zeitpläne
          </Button>
          <Button variant="outline" onClick={onFixStuckSchedules} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldAlert className="mr-2 h-4 w-4 text-red-600" />
            )}
            Repariere blockierte Zeitpläne
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Praxis</TableHead>
                <TableHead>Häufigkeit</TableHead>
                <TableHead>Uhrzeit</TableHead>
                <TableHead>Umfang</TableHead>
                <TableHead>Letzter Lauf</TableHead>
                <TableHead>Nächster Lauf</TableHead>
                <TableHead>Aufbewahrung</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    Keine Zeitpläne konfiguriert
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>{schedule.practice ? schedule.practice.name : "Alle Praxen"}</TableCell>
                    <TableCell>{getScheduleTypeLabel(schedule.schedule_type)}</TableCell>
                    <TableCell>{schedule.time_of_day}</TableCell>
                    <TableCell>{schedule.backup_scope === "full" ? "Vollständig" : "Praxis"}</TableCell>
                    <TableCell>
                      {schedule.last_run_at ? formatDateDE(schedule.last_run_at) : "Noch nicht ausgeführt"}
                    </TableCell>
                    <TableCell>{schedule.next_run_at ? formatDateDE(schedule.next_run_at) : "-"}</TableCell>
                    <TableCell>{schedule.retention_days} Tage</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={schedule.is_active}
                          onCheckedChange={() => onToggleSchedule(schedule.id, schedule.is_active)}
                        />
                        {schedule.is_active ? (
                          <Badge className="bg-green-500">Aktiv</Badge>
                        ) : (
                          <Badge variant="secondary">Inaktiv</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => handleEditSchedule(schedule)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
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

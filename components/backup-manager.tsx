"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Cloud, Loader2 } from "lucide-react"

import { useBackupManager } from "./backup-manager/use-backup-manager"
import { BackupsTab } from "./backup-manager/backups-tab"
import { SchedulesTab } from "./backup-manager/schedules-tab"
import { GoogleDriveTab } from "./backup-manager/google-drive-tab"
import type { Backup, Practice } from "./backup-manager/types"

interface BackupManagerProps {
  userId: string
  practices: Practice[]
}

export function BackupManager({ userId, practices }: BackupManagerProps) {
  const [activeTab, setActiveTab] = useState("backups")
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<Backup | null>(null)
  const [uploadedBackupFile, setUploadedBackupFile] = useState<File | null>(null)

  const {
    backups,
    schedules,
    isLoading,
    isCreatingBackup,
    isCreatingSchedule,
    isSettingUpAll,
    isVerifying,
    isVerifyingAll,
    isRestoring,
    loading,
    showBackupDialog,
    showScheduleDialog,
    filterPractice,
    filterType,
    googleDriveConnected,
    isConnectingGoogleDrive,
    backupForm,
    scheduleForm,
    practicesWithoutSchedules,
    setShowBackupDialog,
    setShowScheduleDialog,
    setFilterPractice,
    setFilterType,
    setBackupForm,
    setScheduleForm,
    fetchBackups,
    createBackup,
    deleteBackup,
    downloadBackup,
    verifyBackup,
    verifyAllBackups,
    restoreBackup,
    createSchedule,
    toggleSchedule,
    setupAllPracticeSchedules,
    diagnoseSchedules,
    fixStuckSchedules,
    connectGoogleDrive,
    disconnectGoogleDrive,
    syncToGoogleDrive,
  } = useBackupManager({ userId, practices })

  const handleRestore = async () => {
    if (!selectedBackupForRestore && !uploadedBackupFile) return

    const success = await restoreBackup(selectedBackupForRestore?.id || null, uploadedBackupFile)
    if (success) {
      setShowRestoreDialog(false)
      setSelectedBackupForRestore(null)
      setUploadedBackupFile(null)
    }
  }

  const handleOpenRestoreDialog = (backup: Backup) => {
    setSelectedBackupForRestore(backup)
    setShowRestoreDialog(true)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="schedules">Zeitpläne</TabsTrigger>
          <TabsTrigger value="google-drive">
            <Cloud className="mr-2 h-4 w-4" />
            Google Drive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-4">
          <BackupsTab
            backups={backups}
            practices={practices}
            filterPractice={filterPractice}
            filterType={filterType}
            isLoading={isLoading}
            isCreatingBackup={isCreatingBackup}
            isVerifying={isVerifying}
            isVerifyingAll={isVerifyingAll}
            googleDriveConnected={googleDriveConnected}
            backupForm={backupForm}
            showBackupDialog={showBackupDialog}
            setShowBackupDialog={setShowBackupDialog}
            setBackupForm={setBackupForm}
            setFilterPractice={setFilterPractice}
            setFilterType={setFilterType}
            onCreateBackup={createBackup}
            onDeleteBackup={deleteBackup}
            onDownloadBackup={downloadBackup}
            onVerifyBackup={verifyBackup}
            onVerifyAllBackups={verifyAllBackups}
            onRefresh={fetchBackups}
            onSyncToGoogleDrive={syncToGoogleDrive}
            onOpenRestoreDialog={handleOpenRestoreDialog}
          />
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <SchedulesTab
            schedules={schedules}
            practices={practices}
            practicesWithoutSchedules={practicesWithoutSchedules}
            isLoading={isLoading}
            isCreatingSchedule={isCreatingSchedule}
            isSettingUpAll={isSettingUpAll}
            loading={loading}
            googleDriveConnected={googleDriveConnected}
            scheduleForm={scheduleForm}
            showScheduleDialog={showScheduleDialog}
            setShowScheduleDialog={setShowScheduleDialog}
            setScheduleForm={setScheduleForm}
            onCreateSchedule={createSchedule}
            onToggleSchedule={toggleSchedule}
            onSetupAllPracticeSchedules={setupAllPracticeSchedules}
            onDiagnoseSchedules={diagnoseSchedules}
            onFixStuckSchedules={fixStuckSchedules}
          />
        </TabsContent>

        <TabsContent value="google-drive" className="space-y-4">
          <GoogleDriveTab
            backups={backups}
            schedules={schedules}
            googleDriveConnected={googleDriveConnected}
            isConnectingGoogleDrive={isConnectingGoogleDrive}
            onConnectGoogleDrive={connectGoogleDrive}
            onDisconnectGoogleDrive={disconnectGoogleDrive}
            onSyncToGoogleDrive={syncToGoogleDrive}
          />
        </TabsContent>
      </Tabs>

      {/* Restore Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Backup wiederherstellen</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedBackupForRestore
                ? `Möchten Sie das Backup vom ${new Date(selectedBackupForRestore.created_at).toLocaleDateString("de-DE")} wiederherstellen?`
                : "Wählen Sie eine Backup-Datei zum Wiederherstellen aus."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {!selectedBackupForRestore && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Backup-Datei hochladen</Label>
                <Input
                  type="file"
                  accept=".json"
                  onChange={(e) => setUploadedBackupFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedBackupForRestore(null)
                setUploadedBackupFile(null)
              }}
            >
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={isRestoring || (!selectedBackupForRestore && !uploadedBackupFile)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird wiederhergestellt...
                </>
              ) : (
                "Wiederherstellen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

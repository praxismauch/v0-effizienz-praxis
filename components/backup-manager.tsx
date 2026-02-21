"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Cloud } from "lucide-react"

import { useBackupManager } from "./backup-manager/use-backup-manager"
import { BackupsTab } from "./backup-manager/backups-tab"
import { SchedulesTab } from "./backup-manager/schedules-tab"
import { GoogleDriveTab } from "./backup-manager/google-drive-tab"
import { RestoreDialog } from "./backup-manager/restore-dialog"
import type { Backup, Practice } from "./backup-manager/types"

interface BackupManagerProps {
  userId: string
  practices: Practice[]
}

export function BackupManager({ userId, practices }: BackupManagerProps) {
  const [activeTab, setActiveTab] = useState("backups")
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<Backup | null>(null)

  const {
    backups, schedules, isLoading, isCreatingBackup, isCreatingSchedule, isSettingUpAll,
    isVerifying, isVerifyingAll, isRestoring, backupProgress, backupProgressMessage, loading,
    showBackupDialog, showScheduleDialog, filterPractice, filterType,
    googleDriveConnected, isConnectingGoogleDrive, backupForm, scheduleForm,
    practicesWithoutSchedules,
    setShowBackupDialog, setShowScheduleDialog, setFilterPractice, setFilterType,
    setBackupForm, setScheduleForm, fetchBackups, createBackup, deleteBackup,
    downloadBackup, verifyBackup, verifyAllBackups, restoreBackup, createSchedule,
    updateSchedule, toggleSchedule, editingScheduleId, setEditingScheduleId,
    setupAllPracticeSchedules, diagnoseSchedules, fixStuckSchedules,
    connectGoogleDrive, disconnectGoogleDrive, syncToGoogleDrive,
    triggerBackupNow,
  } = useBackupManager({ userId, practices })

  const handleOpenRestoreDialog = (backup: Backup) => {
    setSelectedBackupForRestore(backup)
    setShowRestoreDialog(true)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="schedules">{"Zeitpläne"}</TabsTrigger>
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
            backupProgress={backupProgress}
            backupProgressMessage={backupProgressMessage}
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
            onFetchBackups={fetchBackups}
            onSyncToGoogleDrive={syncToGoogleDrive}
            onRestoreClick={handleOpenRestoreDialog}
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
            editingScheduleId={editingScheduleId}
            setEditingScheduleId={setEditingScheduleId}
            onCreateSchedule={createSchedule}
            onUpdateSchedule={updateSchedule}
            onToggleSchedule={toggleSchedule}
            onSetupAllPracticeSchedules={setupAllPracticeSchedules}
            onDiagnoseSchedules={diagnoseSchedules}
            onFixStuckSchedules={fixStuckSchedules}
            onTriggerBackupNow={triggerBackupNow}
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

      <RestoreDialog
        open={showRestoreDialog}
        onOpenChange={setShowRestoreDialog}
        selectedBackup={selectedBackupForRestore}
        isRestoring={isRestoring}
        onRestore={restoreBackup}
        onClose={() => {
          setShowRestoreDialog(false)
          setSelectedBackupForRestore(null)
        }}
      />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Cloud, Loader2, Building2, Database, Table2 } from "lucide-react"

import { useBackupManager } from "./backup-manager/use-backup-manager"
import { BackupsTab } from "./backup-manager/backups-tab"
import { SchedulesTab } from "./backup-manager/schedules-tab"
import { GoogleDriveTab } from "./backup-manager/google-drive-tab"
import type { Backup, Practice } from "./backup-manager/types"

interface BackupManagerProps {
  userId: string
  practices: Practice[]
}

interface BackupContents {
  backupId: string
  createdAt: string
  backupScope: string
  tables: Array<{ name: string; rowCount: number }>
  practices: Array<{ id: string; name: string; rowCount: number }>
  metadata: any
}

export function BackupManager({ userId, practices }: BackupManagerProps) {
  const [activeTab, setActiveTab] = useState("backups")
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<Backup | null>(null)
  const [uploadedBackupFile, setUploadedBackupFile] = useState<File | null>(null)
  
  // Advanced restore options
  const [restoreMode, setRestoreMode] = useState<"full" | "practices" | "tables">("full")
  const [backupContents, setBackupContents] = useState<BackupContents | null>(null)
  const [loadingContents, setLoadingContents] = useState(false)
  const [selectedPracticeIds, setSelectedPracticeIds] = useState<string[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])

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
    backupProgress,
    backupProgressMessage,
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
    updateSchedule,
    toggleSchedule,
    editingScheduleId,
    setEditingScheduleId,
    setupAllPracticeSchedules,
    diagnoseSchedules,
    fixStuckSchedules,
    connectGoogleDrive,
    disconnectGoogleDrive,
    syncToGoogleDrive,
  } = useBackupManager({ userId, practices })

  // Load backup contents when selecting a backup for restore
  useEffect(() => {
    async function loadBackupContents() {
      if (!selectedBackupForRestore) {
        setBackupContents(null)
        return
      }
      
      setLoadingContents(true)
      try {
        const response = await fetch(`/api/super-admin/backups/contents?backupId=${selectedBackupForRestore.id}`)
        if (response.ok) {
          const data = await response.json()
          setBackupContents(data)
          // Reset selections when loading new backup
          setSelectedPracticeIds([])
          setSelectedTables([])
          setRestoreMode("full")
        }
      } catch (error) {
        console.error("Error loading backup contents:", error)
      } finally {
        setLoadingContents(false)
      }
    }
    
    loadBackupContents()
  }, [selectedBackupForRestore])

  const handleRestore = async () => {
    if (!selectedBackupForRestore && !uploadedBackupFile) return

    const success = await restoreBackup(
      selectedBackupForRestore?.id || null, 
      uploadedBackupFile,
      restoreMode,
      selectedPracticeIds,
      selectedTables
    )
    if (success) {
      setShowRestoreDialog(false)
      setSelectedBackupForRestore(null)
      setUploadedBackupFile(null)
      setRestoreMode("full")
      setSelectedPracticeIds([])
      setSelectedTables([])
      setBackupContents(null)
    }
  }

  const handleOpenRestoreDialog = (backup: Backup) => {
    setSelectedBackupForRestore(backup)
    setShowRestoreDialog(true)
  }

  const togglePracticeSelection = (practiceId: string) => {
    setSelectedPracticeIds((prev) =>
      prev.includes(practiceId) ? prev.filter((id) => id !== practiceId) : [...prev, practiceId]
    )
  }

  const toggleTableSelection = (tableName: string) => {
    setSelectedTables((prev) =>
      prev.includes(tableName) ? prev.filter((t) => t !== tableName) : [...prev, tableName]
    )
  }

  const selectAllPractices = () => {
    if (backupContents) {
      setSelectedPracticeIds(backupContents.practices.map((p) => p.id))
    }
  }

  const selectAllTables = () => {
    if (backupContents) {
      setSelectedTables(backupContents.tables.map((t) => t.name))
    }
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
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>Backup wiederherstellen</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedBackupForRestore
                ? `Backup vom ${new Date(selectedBackupForRestore.created_at).toLocaleDateString("de-DE")} wiederherstellen`
                : "Wählen Sie eine Backup-Datei zum Wiederherstellen aus."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {!selectedBackupForRestore && (
              <div className="space-y-2">
                <Label>Backup-Datei hochladen</Label>
                <Input
                  type="file"
                  accept=".json"
                  onChange={(e) => setUploadedBackupFile(e.target.files?.[0] || null)}
                />
              </div>
            )}

            {selectedBackupForRestore && (
              <>
                {loadingContents ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Backup-Inhalt wird geladen...</span>
                  </div>
                ) : backupContents ? (
                  <>
                    {/* Restore Mode Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Wiederherstellungsmodus</Label>
                      <RadioGroup value={restoreMode} onValueChange={(v) => setRestoreMode(v as any)}>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                          <RadioGroupItem value="full" id="mode-full" />
                          <Label htmlFor="mode-full" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              <span className="font-medium">Vollständige Wiederherstellung</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Alle Daten aus dem Backup wiederherstellen
                            </p>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                          <RadioGroupItem value="practices" id="mode-practices" />
                          <Label htmlFor="mode-practices" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <span className="font-medium">Nach Praxis wiederherstellen</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Nur ausgewählte Praxen wiederherstellen
                            </p>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                          <RadioGroupItem value="tables" id="mode-tables" />
                          <Label htmlFor="mode-tables" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Table2 className="h-4 w-4" />
                              <span className="font-medium">Nach Tabelle wiederherstellen</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Nur ausgewählte Tabellen wiederherstellen
                            </p>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Practice Selection */}
                    {restoreMode === "practices" && backupContents.practices.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Praxen auswählen</Label>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={selectAllPractices}>
                              Alle auswählen
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setSelectedPracticeIds([])}>
                              Keine auswählen
                            </Button>
                          </div>
                        </div>
                        <ScrollArea className="h-48 border rounded-lg p-3">
                          <div className="space-y-2">
                            {backupContents.practices.map((practice) => (
                              <div
                                key={practice.id}
                                className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded"
                              >
                                <Checkbox
                                  id={`practice-${practice.id}`}
                                  checked={selectedPracticeIds.includes(practice.id)}
                                  onCheckedChange={() => togglePracticeSelection(practice.id)}
                                />
                                <Label htmlFor={`practice-${practice.id}`} className="flex-1 cursor-pointer">
                                  <div className="flex items-center justify-between">
                                    <span>{practice.name}</span>
                                    <Badge variant="secondary">{practice.rowCount} Einträge</Badge>
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        {selectedPracticeIds.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {selectedPracticeIds.length} Praxis(en) ausgewählt
                          </p>
                        )}
                      </div>
                    )}

                    {/* Table Selection */}
                    {restoreMode === "tables" && backupContents.tables.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Tabellen auswählen</Label>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={selectAllTables}>
                              Alle auswählen
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setSelectedTables([])}>
                              Keine auswählen
                            </Button>
                          </div>
                        </div>
                        <ScrollArea className="h-48 border rounded-lg p-3">
                          <div className="space-y-2">
                            {backupContents.tables.map((table) => (
                              <div
                                key={table.name}
                                className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded"
                              >
                                <Checkbox
                                  id={`table-${table.name}`}
                                  checked={selectedTables.includes(table.name)}
                                  onCheckedChange={() => toggleTableSelection(table.name)}
                                />
                                <Label htmlFor={`table-${table.name}`} className="flex-1 cursor-pointer">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-sm">{table.name}</span>
                                    <Badge variant="secondary">{table.rowCount} Zeilen</Badge>
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        {selectedTables.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {selectedTables.length} Tabelle(n) ausgewählt
                          </p>
                        )}
                      </div>
                    )}

                    {/* Summary */}
                    <div className="bg-muted/50 p-3 rounded-lg text-sm">
                      <p className="font-medium mb-1">Backup-Übersicht:</p>
                      <ul className="text-muted-foreground space-y-1">
                        <li>{backupContents.tables.length} Tabellen im Backup</li>
                        <li>{backupContents.practices.length} Praxen im Backup</li>
                        <li>Erstellt am: {new Date(backupContents.createdAt).toLocaleString("de-DE")}</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Backup-Inhalt konnte nicht geladen werden.
                  </p>
                )}
              </>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedBackupForRestore(null)
                setUploadedBackupFile(null)
                setRestoreMode("full")
                setSelectedPracticeIds([])
                setSelectedTables([])
                setBackupContents(null)
              }}
            >
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={
                isRestoring || 
                (!selectedBackupForRestore && !uploadedBackupFile) ||
                (restoreMode === "practices" && selectedPracticeIds.length === 0) ||
                (restoreMode === "tables" && selectedTables.length === 0)
              }
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

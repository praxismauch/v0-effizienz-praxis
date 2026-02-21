"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Backup, BackupSchedule, BackupFormState, ScheduleFormState, Practice } from "./types"
import { DEFAULT_BACKUP_FORM, DEFAULT_SCHEDULE_FORM } from "./types"
import * as api from "./api"

// Progress simulation steps for backup creation
const BACKUP_PROGRESS_STEPS = [
  { progress: 5, message: "Verbindung zur Datenbank wird hergestellt...", delay: 300 },
  { progress: 10, message: "Tabellen werden analysiert...", delay: 800 },
  { progress: 18, message: "Globale Tabellen werden gesichert...", delay: 1500 },
  { progress: 25, message: "Benutzerdaten werden gesichert...", delay: 2500 },
  { progress: 35, message: "Praxis-Daten werden gesichert...", delay: 4000 },
  { progress: 45, message: "Dokumente werden gesichert...", delay: 6000 },
  { progress: 55, message: "Aufgaben und Ziele werden gesichert...", delay: 8000 },
  { progress: 65, message: "Kalender und HR-Daten werden gesichert...", delay: 10000 },
  { progress: 75, message: "Analysen und Berichte werden gesichert...", delay: 13000 },
  { progress: 82, message: "Formulare und Einstellungen werden gesichert...", delay: 16000 },
  { progress: 88, message: "Backup wird zusammengestellt...", delay: 19000 },
  { progress: 92, message: "Backup wird hochgeladen...", delay: 22000 },
  { progress: 95, message: "Fast fertig...", delay: 26000 },
]

interface UseBackupManagerProps {
  userId: string
  practices: Practice[]
}

export function useBackupManager({ userId, practices }: UseBackupManagerProps) {
  const { toast } = useToast()

  // Data state
  const [backups, setBackups] = useState<Backup[]>([])
  const [schedules, setSchedules] = useState<BackupSchedule[]>([])

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false)
  const [isSettingUpAll, setIsSettingUpAll] = useState(false)
  const [isVerifying, setIsVerifying] = useState<string | null>(null)
  const [isVerifyingAll, setIsVerifyingAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const [backupProgressMessage, setBackupProgressMessage] = useState("")

  // Filter state
  const [filterPractice, setFilterPractice] = useState("all")
  const [filterType, setFilterType] = useState("all")

  // Google Drive state
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false)
  const [isConnectingGoogleDrive, setIsConnectingGoogleDrive] = useState(false)

  // Dialog state
  const [showBackupDialog, setShowBackupDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)

  // Form state
  const [backupForm, setBackupForm] = useState<BackupFormState>(DEFAULT_BACKUP_FORM)
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(DEFAULT_SCHEDULE_FORM)

  // Helper: run an action with error toast
  const withToast = useCallback(
    async <T,>(fn: () => Promise<T>, errorMsg: string): Promise<T | null> => {
      try {
        return await fn()
      } catch (error) {
        console.error(errorMsg, error)
        toast({
          title: "Fehler",
          description: error instanceof Error ? error.message : errorMsg,
          variant: "destructive",
        })
        return null
      }
    },
    [toast]
  )

  // --- Data fetching ---

  const fetchBackups = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await api.fetchBackupsApi(filterPractice, filterType)
      setBackups(data)
    } catch (error) {
      console.error("Error fetching backups:", error)
      toast({ title: "Fehler", description: "Backups konnten nicht geladen werden", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [filterPractice, filterType, toast])

  const fetchSchedules = useCallback(async () => {
    const data = await withToast(() => api.fetchSchedulesApi(), "Zeitpläne konnten nicht geladen werden")
    if (data) setSchedules(data)
  }, [withToast])

  const checkGoogleDriveConnection = useCallback(async () => {
    const connected = await api.checkGoogleDriveApi().catch(() => false)
    setGoogleDriveConnected(connected)
  }, [])

  useEffect(() => {
    fetchBackups()
    fetchSchedules()
    checkGoogleDriveConnection()
  }, [fetchBackups, fetchSchedules, checkGoogleDriveConnection])

  // --- Backup actions ---

  const createBackup = useCallback(async () => {
    try {
      setIsCreatingBackup(true)
      setBackupProgress(0)
      setBackupProgressMessage("Backup wird vorbereitet...")

      const timeouts = BACKUP_PROGRESS_STEPS.map((step) =>
        setTimeout(() => {
          setBackupProgress(step.progress)
          setBackupProgressMessage(step.message)
        }, step.delay)
      )

      const data = await api.createBackupApi(backupForm)
      timeouts.forEach(clearTimeout)

      setBackupProgress(100)
      setBackupProgressMessage("Backup erfolgreich erstellt!")
      await new Promise((resolve) => setTimeout(resolve, 800))

      toast({
        title: "Erfolg",
        description: `Backup wurde erfolgreich erstellt (${data.metadata?.total_rows || 0} Zeilen in ${data.tables_included?.length || 0} Tabellen)`,
      })
      setBackupForm(DEFAULT_BACKUP_FORM)
      fetchBackups()
      return true
    } catch (error) {
      console.error("Error creating backup:", error)
      setBackupProgressMessage("Fehler beim Erstellen des Backups")
      toast({ title: "Fehler", description: error instanceof Error ? error.message : "Backup konnte nicht erstellt werden", variant: "destructive" })
      return false
    } finally {
      setIsCreatingBackup(false)
      setTimeout(() => { setBackupProgress(0); setBackupProgressMessage("") }, 1000)
    }
  }, [backupForm, toast, fetchBackups])

  const deleteBackup = useCallback(async (backupId: string) => {
    const result = await withToast(() => api.deleteBackupApi(backupId), "Backup konnte nicht gelöscht werden")
    if (result !== null) {
      toast({ title: "Erfolg", description: "Backup wurde gelöscht" })
      fetchBackups()
    }
  }, [withToast, toast, fetchBackups])

  const downloadBackup = useCallback(async (backupId: string) => {
    const result = await withToast(() => api.downloadBackupApi(backupId), "Backup konnte nicht heruntergeladen werden")
    if (result) {
      const url = URL.createObjectURL(result.blob)
      const a = document.createElement("a")
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [withToast])

  const restoreBackup = useCallback(async (backupId: string | null, file?: File | null, restoreMode?: string, selectedPracticeIds?: string[], selectedTables?: string[]) => {
    try {
      setIsRestoring(true)
      const result = await api.restoreBackupApi(backupId, file, restoreMode, selectedPracticeIds, selectedTables)
      toast({ title: "Erfolg", description: result.message || "Backup wurde erfolgreich wiederhergestellt" })
      return true
    } catch (error) {
      console.error("Error restoring backup:", error)
      toast({ title: "Fehler", description: error instanceof Error ? error.message : "Backup konnte nicht wiederhergestellt werden", variant: "destructive" })
      return false
    } finally {
      setIsRestoring(false)
    }
  }, [toast])

  // --- Verification ---

  const verifyBackup = useCallback(async (backupId: string) => {
    try {
      setIsVerifying(backupId)
      const data = await api.verifyBackupApi(backupId)
      if (data.verification.verified) {
        toast({ title: "Verifizierung erfolgreich", description: `Backup mit ${data.verification.stats.totalRows} Zeilen in ${data.verification.stats.totalTables} Tabellen verifiziert` })
      } else {
        toast({ title: "Verifizierung fehlgeschlagen", description: data.verification.errors.join(", "), variant: "destructive" })
      }
      fetchBackups()
    } catch (error) {
      console.error("Error verifying backup:", error)
      toast({ title: "Fehler", description: error instanceof Error ? error.message : "Backup konnte nicht verifiziert werden", variant: "destructive" })
    } finally {
      setIsVerifying(null)
    }
  }, [toast, fetchBackups])

  const verifyAllBackups = useCallback(async () => {
    try {
      setIsVerifyingAll(true)
      const data = await api.verifyAllBackupsApi()
      toast({ title: "Batch-Verifizierung abgeschlossen", description: `${data.verified} verifiziert, ${data.failed} fehlgeschlagen von ${data.total} Backups` })
      fetchBackups()
    } catch (error) {
      console.error("Error batch verifying:", error)
      toast({ title: "Fehler", description: "Batch-Verifizierung fehlgeschlagen", variant: "destructive" })
    } finally {
      setIsVerifyingAll(false)
    }
  }, [toast, fetchBackups])

  // --- Schedule actions ---

  const createSchedule = useCallback(async () => {
    try {
      setIsCreatingSchedule(true)
      await api.createScheduleApi(scheduleForm)
      toast({ title: "Erfolg", description: "Backup-Zeitplan wurde erstellt" })
      setScheduleForm(DEFAULT_SCHEDULE_FORM)
      fetchSchedules()
      return true
    } catch (error) {
      console.error("Error creating schedule:", error)
      toast({ title: "Fehler", description: error instanceof Error ? error.message : "Zeitplan konnte nicht erstellt werden", variant: "destructive" })
      return false
    } finally {
      setIsCreatingSchedule(false)
    }
  }, [scheduleForm, toast, fetchSchedules])

  const updateSchedule = useCallback(async (scheduleId: string, data: Partial<ScheduleFormState>) => {
    const result = await withToast(() => api.updateScheduleApi(scheduleId, data), "Zeitplan konnte nicht aktualisiert werden")
    if (result !== null) {
      toast({ title: "Erfolg", description: "Zeitplan wurde aktualisiert" })
      fetchSchedules()
    }
  }, [withToast, toast, fetchSchedules])

  const toggleSchedule = useCallback(async (scheduleId: string, isActive: boolean) => {
    const result = await withToast(() => api.toggleScheduleApi(scheduleId, isActive), "Status konnte nicht geändert werden")
    if (result !== null) {
      toast({ title: "Erfolg", description: `Zeitplan ${isActive ? "aktiviert" : "deaktiviert"}` })
      fetchSchedules()
    }
  }, [withToast, toast, fetchSchedules])

  const setupAllPracticeSchedules = useCallback(async () => {
    try {
      setIsSettingUpAll(true)
      const data = await api.setupAllSchedulesApi()
      toast({ title: "Erfolg", description: `${data.created_count} Backup-Zeitpläne erstellt, ${data.skipped_count} übersprungen` })
      fetchSchedules()
    } catch (error) {
      console.error("Error setting up schedules:", error)
      toast({ title: "Fehler", description: "Zeitpläne konnten nicht erstellt werden", variant: "destructive" })
    } finally {
      setIsSettingUpAll(false)
    }
  }, [toast, fetchSchedules])

  const diagnoseSchedules = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.diagnoseSchedulesApi()
      if (data.summary?.stuck && data.summary.stuck > 0) {
        toast({ title: "Diagnose", description: `${data.summary.stuck} Zeitpläne sind blockiert. Klicken Sie auf "Repariere blockierte Zeitpläne".`, variant: "destructive" })
      } else if (data.summary) {
        toast({ title: "Diagnose", description: `Alle ${data.summary.healthy} Zeitpläne sind gesund. CRON_SECRET: ${data.summary.cron_secret_set ? "gesetzt" : "NICHT gesetzt!"}` })
      } else {
        toast({ title: "Diagnose", description: "Diagnose abgeschlossen - keine Probleme gefunden" })
      }
      fetchSchedules()
      return data
    } catch (error) {
      console.error("Error diagnosing:", error)
      toast({ title: "Fehler", description: "Diagnose fehlgeschlagen", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast, fetchSchedules])

  const fixStuckSchedules = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.fixStuckSchedulesApi()
      toast({ title: "Erfolg", description: `${data.fixed} Zeitpläne repariert, ${data.still_stuck} weiterhin blockiert` })
      fetchSchedules()
    } catch (error) {
      console.error("Error fixing stuck schedules:", error)
      toast({ title: "Fehler", description: "Reparatur fehlgeschlagen", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast, fetchSchedules])

  // --- Trigger backup now ---

  const triggerBackupNow = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.triggerBackupNowApi()
      const successCount = data.results?.filter((r: any) => r.status === "success").length || 0
      const failCount = data.results?.filter((r: any) => r.status === "failed").length || 0
      if (failCount > 0) {
        toast({ title: "Teilweise erfolgreich", description: `${successCount} Backups erstellt, ${failCount} fehlgeschlagen`, variant: "destructive" })
      } else {
        toast({ title: "Erfolg", description: `${successCount} automatische(s) Backup(s) erfolgreich erstellt` })
      }
      fetchBackups()
      fetchSchedules()
      return true
    } catch (error) {
      console.error("Error triggering backup:", error)
      toast({ title: "Fehler", description: error instanceof Error ? error.message : "Backup konnte nicht ausgelöst werden", variant: "destructive" })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast, fetchBackups, fetchSchedules])

  // --- Google Drive ---

  const connectGoogleDrive = useCallback(async () => {
    try {
      setIsConnectingGoogleDrive(true)
      const authUrl = await api.connectGoogleDriveApi(userId)
      if (authUrl) window.location.href = authUrl
    } catch (error) {
      console.error("Error connecting Google Drive:", error)
      toast({ title: "Fehler", description: error instanceof Error ? error.message : "Google Drive-Verbindung konnte nicht hergestellt werden", variant: "destructive" })
      setIsConnectingGoogleDrive(false)
    }
  }, [userId, toast])

  const disconnectGoogleDrive = useCallback(async () => {
    try {
      setIsConnectingGoogleDrive(true)
      await api.disconnectGoogleDriveApi()
      setGoogleDriveConnected(false)
      toast({ title: "Erfolg", description: "Google Drive-Verbindung wurde getrennt" })
    } catch (error) {
      console.error("Error disconnecting Google Drive:", error)
      toast({ title: "Fehler", description: "Google Drive-Verbindung konnte nicht getrennt werden", variant: "destructive" })
    } finally {
      setIsConnectingGoogleDrive(false)
    }
  }, [toast])

  const syncToGoogleDrive = useCallback(async (backupId: string, practiceId: string | null) => {
    const result = await withToast(() => api.syncToGoogleDriveApi(backupId, practiceId), "Synchronisierung mit Google Drive fehlgeschlagen")
    if (result !== null) {
      toast({ title: "Erfolgreich", description: "Backup wurde zu Google Drive synchronisiert" })
      fetchBackups()
    }
  }, [withToast, toast, fetchBackups])

  // --- Computed ---

  const filteredBackups = backups.filter((backup) => {
    if (filterPractice !== "all" && backup.practice_id !== filterPractice) return false
    if (filterType !== "all" && backup.backup_type !== filterType) return false
    return true
  })

  const practicesWithoutSchedules = practices.filter(
    (p) => !schedules.some((s) => s.practice_id === p.id)
  )

  return {
    backups, schedules, filteredBackups, practicesWithoutSchedules,
    isLoading, isCreatingBackup, isCreatingSchedule, isSettingUpAll,
    isVerifying, isVerifyingAll, loading, isRestoring,
    backupProgress, backupProgressMessage,
    filterPractice, filterType, googleDriveConnected, isConnectingGoogleDrive,
    backupForm, scheduleForm, showBackupDialog, showScheduleDialog, editingScheduleId,
    setFilterPractice, setFilterType, setBackupForm, setScheduleForm,
    setShowBackupDialog, setShowScheduleDialog, setEditingScheduleId,
    fetchBackups, fetchSchedules, createBackup, createSchedule,
    updateSchedule, toggleSchedule, deleteBackup, downloadBackup,
    restoreBackup, verifyBackup, verifyAllBackups,
    setupAllPracticeSchedules, diagnoseSchedules, fixStuckSchedules,
    connectGoogleDrive, disconnectGoogleDrive, syncToGoogleDrive,
    triggerBackupNow,
  }
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Backup, BackupSchedule, BackupFormState, ScheduleFormState, Practice } from "./types"
import { DEFAULT_BACKUP_FORM, DEFAULT_SCHEDULE_FORM } from "./types"
import { formatDateDE } from "./utils"

interface UseBackupManagerProps {
  userId: string
  practices: Practice[]
}

export function useBackupManager({ userId, practices }: UseBackupManagerProps) {
  const { toast } = useToast()
  
  // State
  const [backups, setBackups] = useState<Backup[]>([])
  const [schedules, setSchedules] = useState<BackupSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false)
  const [isSettingUpAll, setIsSettingUpAll] = useState(false)
  const [isVerifying, setIsVerifying] = useState<string | null>(null)
  const [isVerifyingAll, setIsVerifyingAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  
  // Filter state
  const [filterPractice, setFilterPractice] = useState("all")
  const [filterType, setFilterType] = useState("all")
  
  // Google Drive state
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false)
  const [isConnectingGoogleDrive, setIsConnectingGoogleDrive] = useState(false)
  
  // Form state
  const [backupForm, setBackupForm] = useState<BackupFormState>(DEFAULT_BACKUP_FORM)
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(DEFAULT_SCHEDULE_FORM)

  // Fetch backups
  const fetchBackups = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filterPractice !== "all") params.set("practiceId", filterPractice)
      if (filterType !== "all") params.set("backupType", filterType)

      const response = await fetch(`/api/super-admin/backups?${params}`)
      if (!response.ok) throw new Error("Failed to fetch backups")

      const data = await response.json()
      setBackups(data)
    } catch (error) {
      console.error("Error fetching backups:", error)
      toast({
        title: "Fehler",
        description: "Backups konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [filterPractice, filterType, toast])

  // Fetch schedules
  const fetchSchedules = useCallback(async () => {
    try {
      const response = await fetch("/api/super-admin/backup-schedules")
      if (!response.ok) throw new Error("Failed to fetch schedules")
      const data = await response.json()
      setSchedules(data)
    } catch (error) {
      console.error("Error fetching schedules:", error)
    }
  }, [])

  // Check Google Drive connection
  const checkGoogleDriveConnection = useCallback(async () => {
    try {
      const response = await fetch("/api/super-admin/backups/google-drive/status")
      if (!response.ok) throw new Error("Failed to fetch connection status")
      const data = await response.json()
      setGoogleDriveConnected(data.connected || false)
    } catch (error) {
      console.error("Error checking Google Drive connection:", error)
      setGoogleDriveConnected(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchBackups()
    fetchSchedules()
    checkGoogleDriveConnection()
  }, [fetchBackups, fetchSchedules, checkGoogleDriveConnection])

  // Create backup
  const createBackup = useCallback(async () => {
    try {
      setIsCreatingBackup(true)
      const response = await fetch("/api/super-admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...backupForm,
          backupType: "manual",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || "Failed to create backup")
      }

      const data = await response.json()
      toast({
        title: "Erfolg",
        description: `Backup wurde erfolgreich erstellt (${data.metadata?.total_rows || 0} Zeilen in ${data.tables_included?.length || 0} Tabellen)`,
      })

      setBackupForm(DEFAULT_BACKUP_FORM)
      fetchBackups()
      return true
    } catch (error) {
      console.error("Error creating backup:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Backup konnte nicht erstellt werden",
        variant: "destructive",
      })
      return false
    } finally {
      setIsCreatingBackup(false)
    }
  }, [backupForm, toast, fetchBackups])

  // Create schedule
  const createSchedule = useCallback(async () => {
    try {
      setIsCreatingSchedule(true)
      const response = await fetch("/api/super-admin/backup-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleForm),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create schedule")
      }

      toast({
        title: "Erfolg",
        description: "Backup-Zeitplan wurde erstellt",
      })

      setScheduleForm(DEFAULT_SCHEDULE_FORM)
      fetchSchedules()
      return true
    } catch (error) {
      console.error("Error creating schedule:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Zeitplan konnte nicht erstellt werden",
        variant: "destructive",
      })
      return false
    } finally {
      setIsCreatingSchedule(false)
    }
  }, [scheduleForm, toast, fetchSchedules])

  // Toggle schedule
  const toggleSchedule = useCallback(async (scheduleId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/super-admin/backup-schedules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: scheduleId, isActive: !isActive }),
      })

      if (!response.ok) throw new Error("Failed to update schedule")

      toast({
        title: "Erfolg",
        description: `Zeitplan wurde ${!isActive ? "aktiviert" : "deaktiviert"}`,
      })

      fetchSchedules()
    } catch (error) {
      console.error("Error toggling schedule:", error)
      toast({
        title: "Fehler",
        description: "Zeitplan konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    }
  }, [toast, fetchSchedules])

  // Delete backup
  const deleteBackup = useCallback(async (backupId: string) => {
    try {
      const response = await fetch(`/api/super-admin/backups?id=${backupId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete backup")

      toast({
        title: "Erfolg",
        description: "Backup wurde gelöscht",
      })

      fetchBackups()
    } catch (error) {
      console.error("Error deleting backup:", error)
      toast({
        title: "Fehler",
        description: "Backup konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }, [toast, fetchBackups])

  // Download backup
  const downloadBackup = useCallback(async (backup: Backup) => {
    try {
      if (backup.file_url) {
        const link = document.createElement("a")
        link.href = backup.file_url
        link.download = `backup-${backup.practice?.name || "system"}-${formatDateDE(backup.created_at).replace(/[:\s]/g, "-")}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Erfolg",
          description: "Backup wird heruntergeladen",
        })
        return
      }

      const response = await fetch(`/api/super-admin/backups/download?id=${backup.id}`)
      if (!response.ok) throw new Error("Failed to download backup")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `backup-${backup.practice?.name || "system"}-${formatDateDE(backup.created_at).replace(/[:\s]/g, "-")}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Erfolg",
        description: "Backup wurde heruntergeladen",
      })
    } catch (error) {
      console.error("Error downloading backup:", error)
      toast({
        title: "Fehler",
        description: "Backup konnte nicht heruntergeladen werden",
        variant: "destructive",
      })
    }
  }, [toast])

  // Restore backup
  const restoreBackup = useCallback(async (backupId: string) => {
    try {
      setIsRestoring(true)
      const response = await fetch("/api/super-admin/backups/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to restore backup")
      }

      toast({
        title: "Erfolg",
        description: "Backup wurde erfolgreich wiederhergestellt",
      })
      return true
    } catch (error) {
      console.error("Error restoring backup:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Backup konnte nicht wiederhergestellt werden",
        variant: "destructive",
      })
      return false
    } finally {
      setIsRestoring(false)
    }
  }, [toast])

  // Upload and restore backup
  const uploadAndRestoreBackup = useCallback(async (file: File) => {
    try {
      setIsRestoring(true)
      const fileContent = await file.text()
      const backupData = JSON.parse(fileContent)

      const response = await fetch("/api/super-admin/backups/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to restore backup")
      }

      toast({
        title: "Erfolg",
        description: "Backup-Datei wurde erfolgreich wiederhergestellt",
      })
      return true
    } catch (error) {
      console.error("Error uploading and restoring backup:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Backup-Datei konnte nicht wiederhergestellt werden",
        variant: "destructive",
      })
      return false
    } finally {
      setIsRestoring(false)
    }
  }, [toast])

  // Verify backup
  const verifyBackup = useCallback(async (backupId: string) => {
    try {
      setIsVerifying(backupId)
      const response = await fetch("/api/super-admin/backups/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Verifizierung fehlgeschlagen")
      }

      const data = await response.json()

      if (data.verification.verified) {
        toast({
          title: "Verifizierung erfolgreich",
          description: `Backup mit ${data.verification.stats.totalRows} Zeilen in ${data.verification.stats.totalTables} Tabellen verifiziert`,
        })
      } else {
        toast({
          title: "Verifizierung fehlgeschlagen",
          description: data.verification.errors.join(", "),
          variant: "destructive",
        })
      }

      fetchBackups()
    } catch (error) {
      console.error("Error verifying backup:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Backup konnte nicht verifiziert werden",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(null)
    }
  }, [toast, fetchBackups])

  // Verify all backups
  const verifyAllBackups = useCallback(async () => {
    try {
      setIsVerifyingAll(true)
      const response = await fetch("/api/super-admin/backups/verify")

      if (!response.ok) throw new Error("Batch-Verifizierung fehlgeschlagen")

      const data = await response.json()

      toast({
        title: "Batch-Verifizierung abgeschlossen",
        description: `${data.verified} verifiziert, ${data.failed} fehlgeschlagen von ${data.total} Backups`,
      })

      fetchBackups()
    } catch (error) {
      console.error("Error batch verifying backups:", error)
      toast({
        title: "Fehler",
        description: "Batch-Verifizierung fehlgeschlagen",
        variant: "destructive",
      })
    } finally {
      setIsVerifyingAll(false)
    }
  }, [toast, fetchBackups])

  // Setup all practice schedules
  const setupAllPracticeSchedules = useCallback(async () => {
    try {
      setIsSettingUpAll(true)
      const response = await fetch("/api/super-admin/backup-schedules/setup-all", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to setup schedules")

      const data = await response.json()

      toast({
        title: "Erfolg",
        description: `${data.created_count} Backup-Zeitpläne erstellt, ${data.skipped_count} übersprungen`,
      })

      fetchSchedules()
    } catch (error) {
      console.error("Error setting up schedules:", error)
      toast({
        title: "Fehler",
        description: "Zeitpläne konnten nicht erstellt werden",
        variant: "destructive",
      })
    } finally {
      setIsSettingUpAll(false)
    }
  }, [toast, fetchSchedules])

  // Diagnose schedules
  const diagnoseSchedules = useCallback(async () => {
    try {
      const response = await fetch("/api/super-admin/backup-schedules/fix-stuck")
      if (!response.ok) throw new Error("Failed to diagnose")

      const data = await response.json()

      if (data.summary.stuck > 0) {
        toast({
          title: "Fehler",
          description: `${data.summary.stuck} Zeitpläne sind blockiert. Klicken Sie auf "Reparieren".`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Erfolg",
          description: `Alle ${data.summary.healthy} Zeitpläne sind gesund.`,
        })
      }

      return data
    } catch (error) {
      console.error("Error diagnosing:", error)
      toast({
        title: "Fehler",
        description: "Diagnose fehlgeschlagen",
        variant: "destructive",
      })
    }
  }, [toast])

  // Fix stuck schedules
  const fixStuckSchedules = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/super-admin/backup-schedules/fix-stuck", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to fix stuck schedules")

      const data = await response.json()
      toast({ title: "Erfolg", description: `${data.fixed_count} Zeitpläne wurden repariert` })

      fetchSchedules()
    } catch (error) {
      console.error("Error fixing stuck schedules:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Reparieren der Zeitpläne",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast, fetchSchedules])

  // Connect Google Drive
  const connectGoogleDrive = useCallback(async () => {
    try {
      setIsConnectingGoogleDrive(true)
      const userEmail = process.env.NEXT_PUBLIC_DEV_USER_EMAIL || userId
      const response = await fetch(
        `/api/super-admin/backups/google-drive/auth?userId=${encodeURIComponent(userEmail || "")}`,
        { credentials: "include" }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to connect Google Drive")
      }

      const { authUrl } = await response.json()

      if (authUrl) {
        window.location.href = authUrl
      }
    } catch (error) {
      console.error("Error connecting Google Drive:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Google Drive-Verbindung konnte nicht hergestellt werden",
        variant: "destructive",
      })
      setIsConnectingGoogleDrive(false)
    }
  }, [userId, toast])

  // Disconnect Google Drive
  const disconnectGoogleDrive = useCallback(async () => {
    try {
      setIsConnectingGoogleDrive(true)
      const response = await fetch("/api/super-admin/backups/google-drive/disconnect", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to disconnect Google Drive")

      setGoogleDriveConnected(false)
      toast({
        title: "Erfolg",
        description: "Google Drive-Verbindung wurde getrennt",
      })
    } catch (error) {
      console.error("Error disconnecting Google Drive:", error)
      toast({
        title: "Fehler",
        description: "Google Drive-Verbindung konnte nicht getrennt werden",
        variant: "destructive",
      })
    } finally {
      setIsConnectingGoogleDrive(false)
    }
  }, [toast])

  // Sync to Google Drive
  const syncToGoogleDrive = useCallback(async (backupId: string, practiceId: string | null) => {
    try {
      const response = await fetch("/api/super-admin/backups/google-drive/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId, practiceId: practiceId || "0" }),
      })

      if (!response.ok) throw new Error("Upload failed")

      toast({
        title: "Erfolgreich",
        description: "Backup wurde zu Google Drive synchronisiert",
      })

      fetchBackups()
    } catch (error) {
      console.error("Error syncing to Google Drive:", error)
      toast({
        title: "Fehler",
        description: "Synchronisierung mit Google Drive fehlgeschlagen",
        variant: "destructive",
      })
    }
  }, [toast, fetchBackups])

  // Computed values
  const filteredBackups = backups.filter((backup) => {
    if (filterPractice !== "all" && backup.practice_id !== filterPractice) return false
    if (filterType !== "all" && backup.backup_type !== filterType) return false
    return true
  })

  const practicesWithoutSchedules = practices.filter(
    (p) => !schedules.some((s) => s.practice_id === p.id)
  )

  return {
    // State
    backups,
    schedules,
    filteredBackups,
    practicesWithoutSchedules,
    isLoading,
    isCreatingBackup,
    isCreatingSchedule,
    isSettingUpAll,
    isVerifying,
    isVerifyingAll,
    loading,
    isRestoring,
    filterPractice,
    filterType,
    googleDriveConnected,
    isConnectingGoogleDrive,
    backupForm,
    scheduleForm,
    
    // Setters
    setFilterPractice,
    setFilterType,
    setBackupForm,
    setScheduleForm,
    
    // Actions
    fetchBackups,
    fetchSchedules,
    createBackup,
    createSchedule,
    toggleSchedule,
    deleteBackup,
    downloadBackup,
    restoreBackup,
    uploadAndRestoreBackup,
    verifyBackup,
    verifyAllBackups,
    setupAllPracticeSchedules,
    diagnoseSchedules,
    fixStuckSchedules,
    connectGoogleDrive,
    disconnectGoogleDrive,
    syncToGoogleDrive,
  }
}

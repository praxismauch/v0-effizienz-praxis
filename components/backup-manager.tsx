"use client"

import { useState, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Download,
  Plus,
  RefreshCw,
  Trash2,
  Pencil,
  AlertTriangle,
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
} from "lucide-react"
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

interface Backup {
  id: string
  practice_id: string | null
  backup_type: string
  backup_scope: string
  file_url: string | null
  file_size: number
  created_by: string | null
  created_at: string
  status: string
  metadata: any
  tables_included: string[]
  notes: string | null
  practice?: { id: string; name: string } | null
  creator?: { id: string; name: string; email: string } | null
  google_drive_file_id?: string | null
}

interface BackupSchedule {
  id: string
  practice_id: string | null
  schedule_type: string
  backup_scope: string
  time_of_day: string
  day_of_week: number | null
  day_of_month: number | null
  is_active: boolean
  retention_days: number
  last_run_at: string | null
  next_run_at: string | null
  created_at: string
  practice?: { id: string; name: string } | null
  syncToGoogleDrive: boolean
}

interface BackupManagerProps {
  userId: string
  practices: any[]
}

export function BackupManager({ userId, practices }: BackupManagerProps) {
  const { toast } = useToast()
  const [backups, setBackups] = useState<Backup[]>([])
  const [schedules, setSchedules] = useState<BackupSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false)
  const [isSettingUpAll, setIsSettingUpAll] = useState(false) // Added state for setup all schedules
  const [isVerifying, setIsVerifying] = useState<string | null>(null)
  const [isVerifyingAll, setIsVerifyingAll] = useState(false)
  const [showBackupDialog, setShowBackupDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [filterPractice, setFilterPractice] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [activeTab, setActiveTab] = useState("backups")
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false)
  const [isConnectingGoogleDrive, setIsConnectingGoogleDrive] = useState(false)
  const [loading, setLoading] = useState(false) // Added state for loading in helper functions

  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<Backup | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [uploadedBackupFile, setUploadedBackupFile] = useState<File | null>(null)

  // Assuming currentUser is available in the scope, e.g., from an auth context
  // Replace with actual way to get current user's email if different
  const currentUser = { email: userId } // Placeholder, replace with actual user object

  const [backupForm, setBackupForm] = useState({
    practiceId: "",
    backupScope: "full",
    notes: "",
  })

  const [scheduleForm, setScheduleForm] = useState({
    practiceId: "",
    scheduleType: "daily",
    backupScope: "full",
    timeOfDay: "02:00",
    dayOfWeek: 1,
    dayOfMonth: 1,
    retentionDays: 30, // Set default value to prevent NaN
    syncToGoogleDrive: false,
  })

  useEffect(() => {
    fetchBackups()
    fetchSchedules()
    // Check Google Drive connection status on mount
    checkGoogleDriveConnection()
  }, [filterPractice, filterType])

  const fetchBackups = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filterPractice !== "all") params.set("practiceId", filterPractice)
      if (filterType !== "all") params.set("backupType", filterType)

      const response = await fetch(`/api/super-admin/backups?${params}`)
      if (!response.ok) throw new Error("Failed to fetch backups")

      const data = await response.json()
      setBackups(data)
    } catch (error: any) {
      console.error("[v0] Error fetching backups:", error)
      toast({
        title: "Fehler",
        description: "Backups konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/super-admin/backup-schedules")
      if (!response.ok) throw new Error("Failed to fetch schedules")

      const data = await response.json()
      setSchedules(data)
    } catch (error: any) {
      console.error("[v0] Error fetching schedules:", error)
    }
  }

  const fixStuckSchedules = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/super-admin/backup-schedules/fix-stuck", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to fix stuck schedules")

      const data = await response.json()
      toast({ title: "Erfolg", description: `${data.fixed_count} Zeitpläne wurden repariert` })

      // Refresh schedules
      await fetchSchedules()
    } catch (error: any) {
      console.error("[v0] Error fixing stuck schedules:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Reparieren der Zeitpläne",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const diagnoseSchedules = async () => {
    try {
      const response = await fetch("/api/super-admin/backup-schedules/fix-stuck")
      if (!response.ok) throw new Error("Failed to diagnose")

      const data = await response.json()
      console.log("[v0] Backup schedule diagnosis:", data)

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
    } catch (error: any) {
      console.error("[v0] Error diagnosing:", error)
      toast({
        title: "Fehler",
        description: "Diagnose fehlgeschlagen",
        variant: "destructive",
      })
    }
  }

  const setupAllPracticeSchedules = async () => {
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
    } catch (error: any) {
      console.error("[v0] Error setting up schedules:", error)
      toast({
        title: "Fehler",
        description: "Zeitpläne konnten nicht erstellt werden",
        variant: "destructive",
      })
    } finally {
      setIsSettingUpAll(false)
    }
  }

  const createBackup = async () => {
    try {
      setIsCreatingBackup(true)
      console.log("[v0] Creating backup with data:", {
        ...backupForm,
        backupType: "manual",
      })

      const response = await fetch("/api/super-admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...backupForm,
          backupType: "manual",
        }),
      })

      console.log("[v0] Backup API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Backup creation failed:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        })
        throw new Error(errorData.error || "Failed to create backup")
      }

      const data = await response.json()
      console.log("[v0] Backup created successfully:", data)

      toast({
        title: "Erfolg",
        description: `Backup wurde erfolgreich erstellt (${data.metadata?.total_rows || 0} Zeilen in ${data.tables_included?.length || 0} Tabellen)`,
      })

      setShowBackupDialog(false)
      setBackupForm({ practiceId: "", backupScope: "full", notes: "" })
      fetchBackups()
    } catch (error) {
      console.error("[v0] Error creating backup:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Backup konnte nicht erstellt werden",
        variant: "destructive",
      })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const createSchedule = async () => {
    try {
      setIsCreatingSchedule(true)
      console.log("[v0] Creating schedule with data:", scheduleForm)

      const response = await fetch("/api/super-admin/backup-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...scheduleForm,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        const errorMessage = responseData.error || "Failed to create schedule"
        console.error("[v0] Schedule creation failed:", errorMessage)
        toast({
          title: "Fehler",
          description: errorMessage,
          variant: "destructive",
        })
        throw new Error(errorMessage)
      }

      console.log("[v0] Schedule created successfully:", responseData)

      toast({
        title: "Erfolg",
        description: "Backup-Zeitplan wurde erstellt",
      })

      setShowScheduleDialog(false)
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
      fetchSchedules()
    } catch (error: any) {
      console.error("[v0] Error creating schedule:", error.message)
    } finally {
      setIsCreatingSchedule(false)
    }
  }

  const toggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/super-admin/backup-schedules", {
        method: "PUT", // Changed from PATCH to PUT as per common REST conventions for full resource update
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: scheduleId, isActive: !isActive }),
      })

      if (!response.ok) throw new Error("Failed to update schedule")

      toast({
        title: "Erfolg",
        description: `Zeitplan wurde ${!isActive ? "aktiviert" : "deaktiviert"}`,
      })

      fetchSchedules()
    } catch (error: any) {
      console.error("[v0] Error toggling schedule:", error)
      toast({
        title: "Fehler",
        description: "Zeitplan konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    }
  }

  const deleteBackup = async (backupId: string) => {
    // Removed confirm dialog, using AlertDialog instead for consistency
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
    } catch (error: any) {
      console.error("[v0] Error deleting backup:", error)
      toast({
        title: "Fehler",
        description: "Backup konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  const formatDateDE = (dateString: string) => {
    // Updated to include time for better readability
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatFileSize = (bytes: number) => {
    // Updated to provide more accurate size formatting
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const downloadBackup = async (backup: Backup) => {
    try {
      console.log("[v0] Downloading backup:", backup.id)

      // If there's a file_url, use it directly
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

      // Otherwise, fetch the backup data from the API
      const response = await fetch(`/api/super-admin/backups/download?id=${backup.id}`)

      if (!response.ok) {
        throw new Error("Failed to download backup")
      }

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
    } catch (error: any) {
      console.error("[v0] Error downloading backup:", error)
      toast({
        title: "Fehler",
        description: "Backup konnte nicht heruntergeladen werden",
        variant: "destructive",
      })
    }
  }

  const restoreBackup = async (backup: Backup) => {
    // Removed confirm dialog, using AlertDialog instead
    try {
      setIsRestoring(true)

      const response = await fetch("/api/super-admin/backups/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId: backup.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to restore backup")
      }

      toast({
        title: "Erfolg",
        description: "Backup wurde erfolgreich wiederhergestellt",
      })

      setShowRestoreDialog(false)
      setSelectedBackupForRestore(null)
    } catch (error: any) {
      console.error("[v0] Error restoring backup:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Backup konnte nicht wiederhergestellt werden",
        variant: "destructive",
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const handleUploadBackup = async () => {
    if (!uploadedBackupFile) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Backup-Datei aus",
        variant: "destructive",
      })
      return
    }

    try {
      setIsRestoring(true)

      const fileContent = await uploadedBackupFile.text()
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

      setShowRestoreDialog(false)
      setUploadedBackupFile(null)
    } catch (error: any) {
      console.error("[v0] Error uploading and restoring backup:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Backup-Datei konnte nicht wiederhergestellt werden",
        variant: "destructive",
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const verifyBackup = async (backupId: string) => {
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
    } catch (error: any) {
      console.error("[v0] Error verifying backup:", error)
      toast({
        title: "Fehler",
        description: error.message || "Backup konnte nicht verifiziert werden",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(null)
    }
  }

  const verifyAllBackups = async () => {
    try {
      setIsVerifyingAll(true)
      const response = await fetch("/api/super-admin/backups/verify")

      if (!response.ok) {
        throw new Error("Batch-Verifizierung fehlgeschlagen")
      }

      const data = await response.json()

      toast({
        title: "Batch-Verifizierung abgeschlossen",
        description: `${data.verified} verifiziert, ${data.failed} fehlgeschlagen von ${data.total} Backups`,
      })

      fetchBackups()
    } catch (error: any) {
      console.error("[v0] Error batch verifying backups:", error)
      toast({
        title: "Fehler",
        description: "Batch-Verifizierung fehlgeschlagen",
        variant: "destructive",
      })
    } finally {
      setIsVerifyingAll(false)
    }
  }

  const practicesWithoutSchedules = practices.filter((p) => !schedules.some((s) => s.practice_id === p.id))

  const connectGoogleDrive = async () => {
    try {
      setIsConnectingGoogleDrive(true)

      const userEmail = process.env.NEXT_PUBLIC_DEV_USER_EMAIL || currentUser?.email
      const response = await fetch(
        `/api/superadmin/backups/google-drive/auth?userId=${encodeURIComponent(userEmail || "")}`,
        {
          credentials: "include",
        },
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
      console.error("[v0] Error connecting Google Drive:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Google Drive-Verbindung konnte nicht hergestellt werden",
        variant: "destructive",
      })
      setIsConnectingGoogleDrive(false)
    }
  }

  const disconnectGoogleDrive = async () => {
    try {
      setIsConnectingGoogleDrive(true)
      const response = await fetch("/api/superadmin/backups/google-drive/disconnect", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to disconnect Google Drive")

      setGoogleDriveConnected(false)
      toast({
        title: "Erfolg",
        description: "Google Drive-Verbindung wurde getrennt",
      })
    } catch (error) {
      console.error("[v0] Error disconnecting Google Drive:", error)
      toast({
        title: "Fehler",
        description: "Google Drive-Verbindung konnte nicht getrennt werden",
        variant: "destructive",
      })
    } finally {
      setIsConnectingGoogleDrive(false)
    }
  }

  const syncToGoogleDrive = async (backupId: string, practiceId: string | null) => {
    try {
      const response = await fetch("/api/superadmin/backups/google-drive/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId, practiceId: practiceId || "0" }),
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      toast({
        title: "Erfolgreich",
        description: "Backup wurde zu Google Drive synchronisiert",
      })

      fetchBackups()
    } catch (error) {
      console.error("[v0] Error syncing to Google Drive:", error)
      toast({
        title: "Fehler",
        description: "Synchronisierung mit Google Drive fehlgeschlagen",
        variant: "destructive",
      })
    }
  }

  const checkGoogleDriveConnection = async () => {
    try {
      const response = await fetch("/api/superadmin/backups/google-drive/status")
      if (!response.ok) throw new Error("Failed to fetch connection status")
      const data = await response.json()
      setGoogleDriveConnected(data.isConnected)
    } catch (error) {
      console.error("[v0] Error checking Google Drive connection:", error)
      setGoogleDriveConnected(false) // Assume not connected if error
    }
  }

  const getVerificationStatus = (backup: Backup) => {
    const verification = backup.metadata?.verification
    if (!verification) return "unknown"
    if (verification.verified) return "verified"
    return "failed"
  }

  const filteredBackups = backups.filter((backup) => {
    if (filterPractice !== "all" && backup.practice_id !== filterPractice) return false
    if (filterType !== "all" && backup.backup_type !== filterType) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {/* Removed Statistics Cards as they are not present in the updates */}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="schedules">Zeitpläne</TabsTrigger>
          <TabsTrigger value="google-drive">
            <Cloud className="mr-2 h-4 w-4" />
            Google Drive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-4">
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

                      <Button onClick={createBackup} disabled={isLoading || isCreatingBackup} className="w-full">
                        {isCreatingBackup ? "Wird erstellt..." : "Backup erstellen"}
                      </Button>
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
                  <Button variant="outline" onClick={fetchBackups}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Aktualisieren
                  </Button>
                  <Button variant="outline" onClick={verifyAllBackups} disabled={isVerifyingAll}>
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
                    {filteredBackups.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          Keine Backups gefunden
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBackups.map((backup) => (
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
                            <Badge variant="outline">
                              {backup.backup_type === "manual"
                                ? "Manuell"
                                : backup.backup_type === "automatic"
                                  ? "Automatisch"
                                  : "Geplant"}
                            </Badge>
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
                                onClick={() => syncToGoogleDrive(backup.id, backup.practice_id)}
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
                                onClick={() => verifyBackup(backup.id)}
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
                                onClick={() => downloadBackup(backup)}
                                title="Backup herunterladen"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBackupForRestore(backup)
                                  setShowRestoreDialog(true)
                                }}
                                title="Wiederherstellen"
                              >
                                <UploadIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteBackup(backup.id)}
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
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Automatische Backup-Zeitpläne</CardTitle>
                  <CardDescription>
                    Konfigurieren Sie automatische Backups für tägliche, wöchentliche oder monatliche Ausführung
                  </CardDescription>
                </div>
                <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Zeitplan erstellen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Neuen Backup-Zeitplan erstellen</DialogTitle>
                      <DialogDescription>Richten Sie automatische Backups ein</DialogDescription>
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
                            onChange={(e) =>
                              setScheduleForm({
                                ...scheduleForm,
                                timeOfDay: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {scheduleForm.scheduleType === "weekly" && (
                        <div className="space-y-2">
                          <Label>Wochentag</Label>
                          <Select
                            value={scheduleForm.dayOfWeek.toString()}
                            onValueChange={(value) =>
                              setScheduleForm({
                                ...scheduleForm,
                                dayOfWeek: Number.parseInt(value),
                              })
                            }
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
                              setScheduleForm({
                                ...scheduleForm,
                                dayOfMonth: Number.parseInt(e.target.value),
                              })
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
                          value={scheduleForm.retentionDays || 30} // Fallback to 30 to prevent empty value
                          onChange={(e) => {
                            const value = Number.parseInt(e.target.value) || 30
                            setScheduleForm({
                              ...scheduleForm,
                              retentionDays: value,
                            })
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
                          onCheckedChange={(checked) =>
                            setScheduleForm({ ...scheduleForm, syncToGoogleDrive: checked })
                          }
                          disabled={!googleDriveConnected}
                        />
                      </div>

                      <Button onClick={createSchedule} disabled={isLoading || isCreatingSchedule} className="w-full">
                        {isCreatingSchedule ? "Wird erstellt..." : "Zeitplan erstellen"}
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
                        onClick={setupAllPracticeSchedules}
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
                <Button variant="outline" onClick={diagnoseSchedules} disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
                  )}
                  Diagnose Zeitpläne
                </Button>
                <Button variant="outline" onClick={fixStuckSchedules} disabled={loading}>
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
                          <TableCell>
                            {schedule.schedule_type === "daily"
                              ? "Täglich"
                              : schedule.schedule_type === "weekly"
                                ? "Wöchentlich"
                                : "Monatlich"}
                          </TableCell>
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
                                onCheckedChange={() => toggleSchedule(schedule.id, schedule.is_active)}
                              />
                              {schedule.is_active ? (
                                <Badge className="bg-green-500">Aktiv</Badge>
                              ) : (
                                <Badge variant="secondary">Inaktiv</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline">
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
        </TabsContent>

        <TabsContent value="google-drive" className="space-y-4">
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
                  onClick={googleDriveConnected ? disconnectGoogleDrive : connectGoogleDrive}
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
                          // Update all schedules to enable/disable Google Drive sync
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
                            {backups.find((b) => b.google_drive_file_id)?.created_at
                              ? formatDateDE(backups.find((b) => b.google_drive_file_id)!.created_at)
                              : "Noch keine Synchronisierung"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Synchronisierte Backups:</span>
                          <span className="font-medium">
                            {backups.filter((b) => b.google_drive_file_id).length} von {backups.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Verwendeter Speicher:</span>
                          <span className="font-medium">
                            {formatFileSize(
                              backups
                                .filter((b) => b.google_drive_file_id)
                                .reduce((sum, b) => sum + (b.file_size || 0), 0),
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sync all button */}
                    <Button
                      onClick={() => {
                        const unsyncedBackups = backups.filter((b) => !b.google_drive_file_id)
                        if (unsyncedBackups.length === 0) {
                          toast({
                            title: "Alle Backups synchronisiert",
                            description: "Es gibt keine unsynchronisierten Backups",
                          })
                          return
                        }
                        // Sync all unsynced backups
                        unsyncedBackups.forEach((backup) => {
                          syncToGoogleDrive(backup.id, backup.practice_id)
                        })
                      }}
                      className="w-full"
                      variant="outline"
                    >
                      <Cloud className="mr-2 h-4 w-4" />
                      Alle nicht synchronisierten Backups hochladen (
                      {backups.filter((b) => !b.google_drive_file_id).length})
                    </Button>
                  </div>
                </>
              )}

              {/* Info card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">Sicherer Cloud-Speicher</p>
                    <p className="text-sm text-blue-700">
                      Ihre Backups werden verschlüsselt in Ihrem persönlichen Google Drive-Konto gespeichert. Sie
                      behalten die volle Kontrolle über Ihre Daten.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add restore dialog at the end of component before closing tag */}
      {/* Replaced Dialog with AlertDialog for consistency with delete confirmations */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Backup wiederherstellen</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedBackupForRestore ? (
                <>
                  Möchten Sie dieses Backup wiederherstellen?
                  <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Backup-ID:</span>
                      <span className="text-sm text-muted-foreground">{selectedBackupForRestore.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Erstellt am:</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDateDE(selectedBackupForRestore.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Typ:</span>
                      <span className="text-sm text-muted-foreground capitalize">
                        {selectedBackupForRestore.backup_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Umfang:</span>
                      <span className="text-sm text-muted-foreground capitalize">
                        {selectedBackupForRestore.backup_scope}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Warnung: Dies wird die aktuellen Daten überschreiben!
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p>Laden Sie eine Backup-Datei hoch, um sie wiederherzustellen.</p>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Input
                      type="file"
                      accept=".json"
                      onChange={(e) => setUploadedBackupFile(e.target.files?.[0] || null)}
                      className="max-w-xs mx-auto"
                    />
                    {uploadedBackupFile && (
                      <p className="mt-2 text-sm text-muted-foreground">Ausgewählt: {uploadedBackupFile.name}</p>
                    )}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
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
              onClick={async () => {
                if (selectedBackupForRestore) {
                  await restoreBackup(selectedBackupForRestore)
                } else {
                  await handleUploadBackup()
                }
              }}
              disabled={isRestoring || (!selectedBackupForRestore && !uploadedBackupFile)}
            >
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

export default BackupManager

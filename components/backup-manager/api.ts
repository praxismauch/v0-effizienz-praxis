import type { Backup, BackupSchedule, BackupFormState, ScheduleFormState } from "./types"

/** Fetch all backups with optional filters */
export async function fetchBackupsApi(filterPractice: string, filterType: string): Promise<Backup[]> {
  const params = new URLSearchParams()
  if (filterPractice !== "all") params.set("practiceId", filterPractice)
  if (filterType !== "all") params.set("backupType", filterType)

  const response = await fetch(`/api/super-admin/backups?${params}`)
  if (!response.ok) throw new Error("Failed to fetch backups")
  return response.json()
}

/** Fetch all backup schedules */
export async function fetchSchedulesApi(): Promise<BackupSchedule[]> {
  const response = await fetch("/api/super-admin/backup-schedules")
  if (!response.ok) throw new Error("Failed to fetch schedules")
  return response.json()
}

/** Check Google Drive connection status */
export async function checkGoogleDriveApi(): Promise<boolean> {
  const response = await fetch("/api/super-admin/backups/google-drive/status")
  if (!response.ok) return false
  const data = await response.json()
  return data.connected || false
}

/** Create a new backup */
export async function createBackupApi(form: BackupFormState): Promise<{ tables_included?: string[]; metadata?: { total_rows?: number } }> {
  const response = await fetch("/api/super-admin/backups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...form, backupType: "manual" }),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to create backup")
  }
  return response.json()
}

/** Create a new schedule */
export async function createScheduleApi(form: ScheduleFormState): Promise<void> {
  const response = await fetch("/api/super-admin/backup-schedules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Failed to create schedule")
}

/** Update an existing schedule */
export async function updateScheduleApi(scheduleId: string, data: Partial<ScheduleFormState>): Promise<void> {
  const response = await fetch(`/api/super-admin/backup-schedules/${scheduleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error("Failed to update schedule")
}

/** Toggle schedule active state */
export async function toggleScheduleApi(scheduleId: string, isActive: boolean): Promise<void> {
  const response = await fetch(`/api/super-admin/backup-schedules/${scheduleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: isActive }),
  })
  if (!response.ok) throw new Error("Failed to toggle schedule")
}

/** Delete a backup */
export async function deleteBackupApi(backupId: string): Promise<void> {
  const response = await fetch(`/api/super-admin/backups/${backupId}`, { method: "DELETE" })
  if (!response.ok) throw new Error("Failed to delete backup")
}

/** Download a backup */
export async function downloadBackupApi(backupId: string): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(`/api/super-admin/backups/${backupId}/download`)
  if (!response.ok) throw new Error("Failed to download backup")
  const blob = await response.blob()
  const filename = response.headers.get("content-disposition")?.match(/filename="?(.+)"?/)?.[1] || `backup-${backupId}.json`
  return { blob, filename }
}

/** Restore a backup */
export async function restoreBackupApi(
  backupId: string | null,
  file?: File | null,
  restoreMode?: string,
  selectedPracticeIds?: string[],
  selectedTables?: string[]
): Promise<{ message?: string }> {
  const body: Record<string, unknown> = { restoreMode: restoreMode || "full" }
  if (restoreMode === "practices" && selectedPracticeIds) body.selectedPracticeIds = selectedPracticeIds
  if (restoreMode === "tables" && selectedTables) body.selectedTables = selectedTables

  if (file) {
    const fileContent = await file.text()
    body.backupData = JSON.parse(fileContent)
  } else if (backupId) {
    body.backupId = backupId
  } else {
    throw new Error("Either backupId or file must be provided")
  }

  const response = await fetch("/api/super-admin/backups/restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to restore backup")
  }
  return response.json()
}

/** Verify a single backup */
export async function verifyBackupApi(backupId: string): Promise<{ verification: { verified: boolean; stats: { totalRows: number; totalTables: number }; errors: string[] } }> {
  const response = await fetch("/api/super-admin/backups/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ backupId }),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Verifizierung fehlgeschlagen")
  }
  return response.json()
}

/** Verify all backups */
export async function verifyAllBackupsApi(): Promise<{ verified: number; failed: number; total: number }> {
  const response = await fetch("/api/super-admin/backups/verify")
  if (!response.ok) throw new Error("Batch-Verifizierung fehlgeschlagen")
  return response.json()
}

/** Setup schedules for all practices */
export async function setupAllSchedulesApi(): Promise<{ created_count: number; skipped_count: number }> {
  const response = await fetch("/api/super-admin/backup-schedules/setup-all", { method: "POST" })
  if (!response.ok) throw new Error("Failed to setup schedules")
  return response.json()
}

/** Diagnose schedule health */
export async function diagnoseSchedulesApi(): Promise<{ summary?: { stuck: number; healthy: number; cron_secret_set: boolean } }> {
  const response = await fetch("/api/super-admin/backup-schedules/fix-stuck")
  if (!response.ok) throw new Error("Failed to diagnose")
  return response.json()
}

/** Fix stuck schedules */
export async function fixStuckSchedulesApi(): Promise<{ fixed: number; still_stuck: number }> {
  const response = await fetch("/api/super-admin/backup-schedules/fix-stuck", { method: "POST" })
  if (!response.ok) throw new Error("Failed to fix stuck schedules")
  return response.json()
}

/** Connect Google Drive */
export async function connectGoogleDriveApi(userId: string): Promise<string | null> {
  const response = await fetch("/api/super-admin/backups/google-drive/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  })
  if (!response.ok) throw new Error("Failed to initiate Google Drive connection")
  const data = await response.json()
  return data.authUrl || null
}

/** Disconnect Google Drive */
export async function disconnectGoogleDriveApi(): Promise<void> {
  const response = await fetch("/api/super-admin/backups/google-drive/disconnect", { method: "POST" })
  if (!response.ok) throw new Error("Failed to disconnect Google Drive")
}

/** Sync a backup to Google Drive */
export async function syncToGoogleDriveApi(backupId: string, practiceId: string | null): Promise<void> {
  const response = await fetch("/api/super-admin/backups/google-drive/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ backupId, practiceId: practiceId || "0" }),
  })
  if (!response.ok) throw new Error("Upload failed")
}

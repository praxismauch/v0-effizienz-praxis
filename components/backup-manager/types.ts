export interface Backup {
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

export interface BackupSchedule {
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

export interface Practice {
  id: string
  name: string
}

export interface BackupFormState {
  practiceId: string
  backupScope: string
  notes: string
}

export interface ScheduleFormState {
  practiceId: string
  scheduleType: string
  backupScope: string
  timeOfDay: string
  dayOfWeek: number
  dayOfMonth: number
  retentionDays: number
  syncToGoogleDrive: boolean
}

export const DEFAULT_BACKUP_FORM: BackupFormState = {
  practiceId: "",
  backupScope: "full",
  notes: "",
}

export const DEFAULT_SCHEDULE_FORM: ScheduleFormState = {
  practiceId: "",
  scheduleType: "daily",
  backupScope: "full",
  timeOfDay: "02:00",
  dayOfWeek: 1,
  dayOfMonth: 1,
  retentionDays: 30,
  syncToGoogleDrive: false,
}

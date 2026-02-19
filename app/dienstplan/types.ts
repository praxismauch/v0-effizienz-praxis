export interface TeamMember {
  id: string
  first_name: string
  last_name: string
  role?: string
  avatar_url?: string
  email?: string
  department?: string | null
  position?: string | null
}

export interface ShiftType {
  id: string
  practice_id: number
  name: string
  short_name: string
  start_time: string
  end_time: string
  break_minutes: number
  color: string
  min_staff: number
  is_active: boolean
  created_at?: string
}

export interface Shift {
  id: string
  practice_id: number
  team_member_id: string
  shift_type_id: string
  shift_date: string  // Database column name
  date?: string       // Alias for backwards compatibility
  start_time: string
  end_time: string
  status: "scheduled" | "confirmed" | "cancelled" | "completed"
  notes?: string
  created_at?: string
  shift_type?: ShiftType
  team_member?: TeamMember
}

export interface Availability {
  id: string
  team_member_id: string
  practice_id: number
  availability_type: "available" | "unavailable" | "preferred" | "vacation" | "sick"
  day_of_week?: number
  specific_date?: string
  start_time?: string
  end_time?: string
  is_recurring: boolean
  notes?: string
  created_at?: string
  team_member?: TeamMember
}

export interface SwapRequest {
  id: string
  practice_id: number
  requester_id: string
  target_id: string
  requester_shift_id: string
  target_shift_id: string
  status: "pending" | "approved" | "rejected"
  reason?: string
  ai_recommendation?: string
  created_at?: string
  reviewed_at?: string
  reviewed_by?: string
  requester?: TeamMember
  target?: TeamMember
  requester_shift?: Shift
  target_shift?: Shift
}

export interface Violation {
  id: string
  team_member_id: string
  shift_id?: string
  violation_type: string
  severity: "info" | "warning" | "error"
  description: string
  resolved: boolean
  resolved_at?: string
  resolved_by?: string
  team_member?: TeamMember
}

export interface DienstplanStats {
  pendingSwaps: number
  activeViolations: number
  totalShifts: number
  coveredShifts: number
  coverageRate: number
}

export const DAYS_OF_WEEK = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]

export interface ScheduleTemplateShift {
  day_of_week: number // 0-6 (Monday-Sunday)
  shift_type_id: string
  role_filter?: string // Optional: only assign to members with this role
}

export interface ScheduleTemplate {
  id: string
  practice_id: string
  name: string
  description?: string
  shifts: ScheduleTemplateShift[]
  is_default: boolean
  created_at?: string
  updated_at?: string
}

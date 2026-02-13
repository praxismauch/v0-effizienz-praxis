import { Building2, Home, Car } from "lucide-react"

export interface TimeStamp {
  id: string
  user_id: string
  practice_id: string
  stamp_type: "start" | "stop" | "pause_start" | "pause_end"
  timestamp: string
  work_location: string
  device_fingerprint?: string
  ip_address?: string
  latitude?: number
  longitude?: number
  comment?: string
  created_at: string
  updated_at: string
}

export interface TimeBlock {
  id: string
  user_id: string
  practice_id: string
  date: string
  start_time: string
  end_time?: string
  planned_hours?: number
  actual_hours?: number
  break_minutes: number
  gross_minutes?: number
  net_minutes?: number
  work_location: string
  is_open: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
  current_status?: "working" | "break" | "absent"
  current_location?: string
  today_minutes?: number
}

export interface CorrectionRequest {
  id: string
  user_id: string
  correction_type: string
  requested_changes: any
  reason: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  reviewed_by?: string
  review_comment?: string
}

export interface MonthlyReport {
  total_work_days: number
  total_net_minutes: number
  overtime_minutes: number
  homeoffice_days: number
  corrections_count: number
  plausibility_warnings: number
}

// Database constraint: location_type IN ('office', 'homeoffice', 'mobile')
export const WORK_LOCATIONS = [
  { value: "office", label: "Praxis vor Ort", icon: Building2, color: "bg-blue-100 text-blue-700" },
  { value: "homeoffice", label: "Homeoffice", icon: Home, color: "bg-purple-100 text-purple-700" },
  { value: "mobile", label: "Mobil / Außentermin", icon: Car, color: "bg-orange-100 text-orange-700" },
] as const

export type WorkLocation = (typeof WORK_LOCATIONS)[number]["value"]

export interface ZeiterfassungContext {
  practiceId: string | null
  userId: string | undefined
  currentStatus: "idle" | "working" | "break"
  currentBlock: TimeBlock | null
  selectedLocation: string
  timeBlocks: TimeBlock[]
  teamMembers: TeamMember[]
  correctionRequests: CorrectionRequest[]
  plausibilityIssues: any[]
  monthlyReport: MonthlyReport | null
  overtimeBalance: number
  homeofficePolicy: any | null
  homeofficeCheckResult: any | null
}

import { parseISO, differenceInMinutes } from "date-fns"

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
  overtime_minutes: number
  location_type: string
  status: "active" | "completed" | "cancelled"
  notes?: string
  auto_stopped?: boolean
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  user_id: string
  first_name: string
  last_name: string
  name?: string
  role: string
  team_ids?: string[]
  team_member_id?: string
}

export interface Team {
  id: string
  name: string
  color: string
  memberCount: number
}

/** Format minutes to HH:MM */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(Math.abs(minutes) / 60)
  const mins = Math.abs(minutes) % 60
  const sign = minutes < 0 ? "-" : ""
  return `${sign}${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

/** Calculate work duration in minutes */
export function calculateWorkDuration(block: TimeBlock): number {
  if (!block.end_time) return 0
  const start = parseISO(block.start_time)
  const end = parseISO(block.end_time)
  const totalMinutes = differenceInMinutes(end, start)
  return Math.max(0, totalMinutes - block.break_minutes)
}

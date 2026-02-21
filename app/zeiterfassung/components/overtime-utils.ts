export interface TeamMemberOvertime {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
  overtime_total_minutes: number
  overtime_this_week_minutes: number
  overtime_this_month_minutes: number
  planned_hours_per_week: number
  actual_hours_this_week: number
  actual_hours_this_month: number
}

export const formatOvertimeMinutes = (minutes: number) => {
  if (!minutes || isNaN(minutes)) return "0:00"
  const h = Math.floor(Math.abs(minutes) / 60)
  const m = Math.abs(minutes) % 60
  const sign = minutes < 0 ? "-" : minutes > 0 ? "+" : ""
  return `${sign}${h}:${m.toString().padStart(2, "0")}`
}

export const formatHours = (hours: number) => {
  if (!hours || isNaN(hours)) return "0:00"
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}:${m.toString().padStart(2, "0")}`
}

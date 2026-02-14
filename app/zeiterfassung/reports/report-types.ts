export interface MonthlyTimeReport {
  id: string
  practice_id: number
  user_id: string
  year: number
  month: number
  total_work_days: number
  total_gross_minutes: number
  total_break_minutes: number
  total_net_minutes: number
  overtime_minutes: number
  undertime_minutes: number
  homeoffice_days: number
  sick_days: number
  vacation_days: number
  training_days: number
  corrections_count: number
  plausibility_warnings: number
  report_data: {
    daily_breakdown?: Array<{
      date: string
      start_time: string
      end_time: string
      gross_minutes: number
      break_minutes: number
      net_minutes: number
      work_location: string
      plausibility_status: string
    }>
  }
  generated_at: string
  team_members?: {
    first_name: string
    last_name: string
    email: string
    avatar_url?: string
  }
}

export const MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
]

export const CURRENT_YEAR = new Date().getFullYear()
export const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

export function formatMinutes(minutes: number) {
  const h = Math.floor(Math.abs(minutes) / 60)
  const m = Math.abs(minutes) % 60
  const sign = minutes < 0 ? "-" : ""
  return `${sign}${h}h ${m}min`
}

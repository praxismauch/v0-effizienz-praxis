export interface Responsibility {
  id: string
  name: string
  description?: string
  category?: string
  group_name?: string
  responsible_user_id?: string
  responsible_user_name?: string
  deputy_user_id?: string
  deputy_user_name?: string
  suggested_hours_per_week?: number
  cannot_complete_during_consultation?: boolean
  optimization_suggestions?: string
  is_active?: boolean
}

export interface Team {
  id: string
  name: string
  description?: string
  color?: string
  practice_id?: number
  display_order?: number
}

export interface TeamMember {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  position?: string
  avatar_url?: string
  team_ids?: string[]
  status?: string
  skills?: string[]
  department?: string
  joined_date?: string
  joinedAt?: string
  is_active?: boolean
  isActive?: boolean
}

export interface SortableTeamCardProps {
  team: Team
  teamMemberCount: number
  cardStyles: { backgroundColor: string; borderLeftColor: string }
  teamColor: string
  onEdit: (team: Team) => void
  onDelete: (team: Team) => void
}

export const getTeamColor = (colorName?: string): string => {
  if (!colorName) return "#3b82f6"

  // If the value is already a hex color (e.g. from default_teams), return it directly
  if (colorName.startsWith("#")) return colorName

  // If the value is an rgb/hsl color, return it directly
  if (colorName.startsWith("rgb") || colorName.startsWith("hsl")) return colorName

  // Otherwise map named colors to hex
  const colors: Record<string, string> = {
    blue: "#3b82f6",
    green: "#22c55e",
    purple: "#a855f7",
    orange: "#f97316",
    pink: "#ec4899",
    yellow: "#eab308",
    red: "#ef4444",
    teal: "#14b8a6",
    indigo: "#6366f1",
    cyan: "#06b6d4",
    lime: "#84cc16",
    amber: "#f59e0b",
    rose: "#f43f5e",
    emerald: "#10b981",
    violet: "#8b5cf6",
    sky: "#0ea5e9",
    slate: "#64748b",
    gray: "#6b7280",
  }
  return colors[colorName.toLowerCase()] || "#3b82f6"
}

export const getCardStyles = (color: string) => {
  return {
    backgroundColor: `${color}10`,
    borderLeftColor: color,
  }
}

export interface HolidayRequest {
  id: string
  practice_id: string
  team_member_id: string
  user_id?: string
  start_date: string
  end_date: string
  days_count?: number
  status: "pending" | "approved" | "rejected" | "cancelled"
  reason?: string
  notes?: string
  created_at?: string
}

export interface StaffingPlan {
  id: string
  name: string
  description?: string
  practice_id?: string
}

export interface SickLeave {
  id: string
  team_member_id: string
  start_date: string
  end_date?: string
  reason?: string
  notes?: string
}

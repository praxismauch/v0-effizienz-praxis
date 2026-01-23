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
  }
  return colorName ? colors[colorName] || colors.blue : colors.blue
}

export const getCardStyles = (color: string) => {
  return {
    backgroundColor: `${color}10`,
    borderLeftColor: color,
  }
}

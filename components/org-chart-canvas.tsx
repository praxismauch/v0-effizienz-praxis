"use client"

import { OrgChartCanvas as TeamOrgChartCanvas } from "@/components/team/org-chart-canvas"

interface Position {
  id: string
  position_title: string
  department?: string
  user_id?: string | null
  reports_to_position_id?: string | null
  level: number
  display_order: number
  color?: string
}

interface TeamMember {
  id: string
  first_name: string
  last_name: string
  position?: string
  email?: string
  avatar?: string | null
  avatar_url?: string | null
}

interface OrgChartCanvasProps {
  positions: Position[]
  teamMembers: TeamMember[]
  onEditPosition: (position: Position) => void
  onDeletePosition: (id: string) => void
  onCreate?: () => void
  isAdmin: boolean
  practiceId?: string
}

export function OrgChartCanvas({
  positions,
  teamMembers,
  onEditPosition,
  onDeletePosition,
  onCreate,
  isAdmin,
  practiceId = "",
}: OrgChartCanvasProps) {
  // Adapt positions to include user_name and user_avatar from teamMembers
  const adaptedPositions = positions.map((pos) => {
    const member = teamMembers.find((m) => m.id === pos.user_id)
    return {
      ...pos,
      user_name: member ? `${member.first_name} ${member.last_name}` : undefined,
      user_avatar: member ? (member.avatar_url || member.avatar) : undefined,
    }
  })

  return (
    <TeamOrgChartCanvas
      positions={adaptedPositions}
      onEdit={onEditPosition}
      onDelete={onDeletePosition}
      onCreate={onCreate || (() => console.log("[v0] onCreate handler not provided"))}
      isAdmin={isAdmin}
      practiceId={practiceId}
    />
  )
}

export default OrgChartCanvas

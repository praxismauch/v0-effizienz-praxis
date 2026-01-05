"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OrgChartCanvas } from "@/components/org-chart-canvas"

interface Position {
  id: string
  position_title: string
  department: string
  user_id: string | null
  reports_to_position_id: string | null
  level: number
  is_management: boolean
  display_order: number
  color?: string
}

interface TeamMember {
  id: string
  first_name: string
  last_name: string
  position?: string
  email?: string
}

interface OrgChartFullscreenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  positions: Position[]
  teamMembers: TeamMember[]
  onEditPosition: (position: Position) => void
  onDeletePosition: (id: string) => void
  isAdmin: boolean
}

export function OrgChartFullscreenDialog({
  open,
  onOpenChange,
  positions,
  teamMembers,
  onEditPosition,
  onDeletePosition,
  isAdmin,
}: OrgChartFullscreenDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Organigramm Vollansicht</DialogTitle>
          <DialogDescription>Vollbildansicht des Organigramms mit allen Positionen</DialogDescription>
        </DialogHeader>
        <div className="h-[90vh] p-6">
          <OrgChartCanvas
            positions={positions}
            teamMembers={teamMembers}
            onEditPosition={onEditPosition}
            onDeletePosition={onDeletePosition}
            isAdmin={isAdmin}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default OrgChartFullscreenDialog

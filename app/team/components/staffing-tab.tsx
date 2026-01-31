"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Calendar } from "lucide-react"
import type { StaffingPlan, TeamMember } from "../types"
import CreateStaffingPlanDialog from "./create-staffing-plan-dialog"

interface StaffingTabProps {
  staffingPlans: StaffingPlan[]
  teamMembers: TeamMember[]
  onPlanCreated: (plan: StaffingPlan) => void
  onEditPlan: (plan: StaffingPlan) => void
}

export default function StaffingTab({
  staffingPlans,
  teamMembers,
  onPlanCreated,
  onEditPlan,
}: StaffingTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  if (staffingPlans.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Stellenpläne</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Erstellen Sie Ihren ersten Stellenplan, um die Personalplanung zu optimieren.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Stellenplan erstellen
            </Button>
          </CardContent>
        </Card>
        <CreateStaffingPlanDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onPlanCreated={(plan) => {
            onPlanCreated(plan)
            setDialogOpen(false)
          }}
        />
      </>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Stellenpläne</h3>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Stellenplan
        </Button>
      </div>

      <CreateStaffingPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onPlanCreated={(plan) => {
          onPlanCreated(plan)
          setDialogOpen(false)
        }}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staffingPlans.map((plan) => (
          <Card
            key={plan.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onEditPlan(plan)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{plan.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(plan.valid_from).toLocaleDateString("de-DE")} -
                  {plan.valid_until
                    ? new Date(plan.valid_until).toLocaleDateString("de-DE")
                    : "Unbefristet"}
                </span>
              </div>
              <Badge variant={plan.is_active ? "default" : "secondary"}>
                {plan.is_active ? "Aktiv" : "Inaktiv"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

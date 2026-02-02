"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"
import type { StaffingPlan, TeamMember, Team, Responsibility } from "../types"
import CreateStaffingPlanDialog from "./create-staffing-plan-dialog"
import { StaffingPlanGrid } from "@/components/team/staffing-plan-grid"
import { StaffingPlansManager } from "@/components/team/staffing-plans-manager"
import { usePractice } from "@/contexts/practice-context"
import { useAuth } from "@/contexts/auth-context"

interface StaffingEntry {
  id: string
  day_of_week: number
  time_slot: "am" | "pm"
  team_id: string
  hours: number
  name?: string
  notes?: string
  team?: Team
  calculate_from_timespan?: boolean
  start_time?: string
  end_time?: string
  display_order?: number
}

interface StaffingTabProps {
  staffingPlans: StaffingPlan[]
  teamMembers: TeamMember[]
  teams?: Team[]
  responsibilities?: Responsibility[]
  onPlanCreated: (plan: StaffingPlan) => void
  onEditPlan: (plan: StaffingPlan) => void
  onRefresh?: () => void
}

export default function StaffingTab({
  staffingPlans,
  teamMembers,
  teams: propTeams,
  responsibilities: propResponsibilities,
  onPlanCreated,
  onEditPlan,
  onRefresh,
}: StaffingTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [entries, setEntries] = useState<StaffingEntry[]>([])
  const [teams, setTeams] = useState<Team[]>(propTeams || [])
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>(propResponsibilities || [])
  const [isLoadingEntries, setIsLoadingEntries] = useState(false)
  
  const { currentPractice } = usePractice()
  const { user } = useAuth()
  const practiceId = currentPractice?.id?.toString()
  const isAdmin = user?.role === "admin" || user?.role === "superadmin" || user?.is_practice_admin



  // Auto-select first plan if none selected
  useEffect(() => {
    if (staffingPlans.length > 0 && !selectedPlanId) {
      const activePlan = staffingPlans.find(p => p.is_active) || staffingPlans[0]
      setSelectedPlanId(activePlan.id)
    }
  }, [staffingPlans, selectedPlanId])

  // Load teams if not provided
  useEffect(() => {
    if (!propTeams && practiceId) {
      fetch(`/api/practices/${practiceId}/teams`)
        .then(res => res.json())
        .then(data => setTeams(data.teams || []))
        .catch(err => console.error("Error loading teams:", err))
    }
  }, [propTeams, practiceId])

  // Load responsibilities if not provided
  useEffect(() => {
    if (!propResponsibilities && practiceId) {
      fetch(`/api/practices/${practiceId}/responsibilities`)
        .then(res => res.json())
        .then(data => setResponsibilities(data.responsibilities || []))
        .catch(err => console.error("Error loading responsibilities:", err))
    }
  }, [propResponsibilities, practiceId])

  // Load staffing entries when plan is selected
  const loadEntries = useCallback(async () => {
    if (!practiceId || !selectedPlanId) {
      setEntries([])
      return
    }

    setIsLoadingEntries(true)
    try {
      const res = await fetch(`/api/practices/${practiceId}/staffing-plan?planId=${selectedPlanId}`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error("Error loading staffing entries:", error)
    } finally {
      setIsLoadingEntries(false)
    }
  }, [practiceId, selectedPlanId])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const handleRefresh = () => {
    loadEntries()
    onRefresh?.()
  }

  if (staffingPlans.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Bedarfspläne</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Erstellen Sie Ihren ersten Bedarfsplan, um die Personalplanung zu optimieren.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Bedarfsplan erstellen
            </Button>
          </CardContent>
        </Card>
        <CreateStaffingPlanDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onPlanCreated={(plan) => {
            onPlanCreated(plan)
            setSelectedPlanId(plan.id)
            setDialogOpen(false)
          }}
        />
      </>
    )
  }

  return (
    <div className="space-y-4">
      {/* Plan selector and management */}
      <StaffingPlansManager
        plans={staffingPlans}
        selectedPlanId={selectedPlanId}
        onSelectPlan={setSelectedPlanId}
        onPlanCreated={handleRefresh}
        onPlanUpdated={handleRefresh}
        onPlanDeleted={handleRefresh}
        practiceId={practiceId || ""}
        isAdmin={!!isAdmin}
      />

      {/* Weekly grid view */}
      {selectedPlanId && practiceId && (
        <Card>
          <CardContent className="p-4">
            {isLoadingEntries ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <StaffingPlanGrid
                entries={entries}
                teams={teams}
                practiceId={practiceId}
                selectedPlanId={selectedPlanId}
                onRefresh={loadEntries}
                isAdmin={!!isAdmin}
                responsibilities={responsibilities}
              />
            )}
          </CardContent>
        </Card>
      )}

      <CreateStaffingPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onPlanCreated={(plan) => {
          onPlanCreated(plan)
          setSelectedPlanId(plan.id)
          setDialogOpen(false)
        }}
      />
    </div>
  )
}

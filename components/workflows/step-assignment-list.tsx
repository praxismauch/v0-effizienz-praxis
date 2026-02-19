"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronRight, Loader2, User } from "lucide-react"
import { isActiveMember } from "@/lib/utils/team-member-filter"
import type { StepAssignment } from "./use-workflow-form"

interface StepAssignmentListProps {
  stepAssignments: StepAssignment[]
  expandedSteps: Set<number>
  teamMembers: any[]
  isLoadingMembers: boolean
  onUpdateStep: (index: number, userId: string | undefined) => void
  onUpdateSubitem: (stepIndex: number, subitemIndex: number, userId: string | undefined) => void
  onToggleExpanded: (index: number) => void
}

function MemberSelect({
  value,
  onChange,
  teamMembers,
  isLoading,
  className = "w-[200px]",
}: {
  value?: string
  onChange: (userId: string | undefined) => void
  teamMembers: any[]
  isLoading: boolean
  className?: string
}) {
  return (
    <Select value={value || "unassigned"} onValueChange={(v) => onChange(v === "unassigned" ? undefined : v)}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Verantwortlich..." />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Lade Teammitglieder...
          </SelectItem>
        ) : (
          <>
            <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
            {teamMembers.filter(isActiveMember).map((member) => (
              <SelectItem key={member.id} value={member.userId || member.id}>
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  {member.name}
                </div>
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  )
}

export function StepAssignmentList({
  stepAssignments,
  expandedSteps,
  teamMembers,
  isLoadingMembers,
  onUpdateStep,
  onUpdateSubitem,
  onToggleExpanded,
}: StepAssignmentListProps) {
  return (
    <div className="space-y-3">
      {stepAssignments.map((step, index) => (
        <div key={index} className="border rounded-lg p-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                {index + 1}
              </div>
              <div className="flex-1">
                <span className="font-medium text-sm">{step.title}</span>
                {step.subitems && step.subitems.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleExpanded(index)}
                    className="ml-2 h-6 px-2 text-xs"
                  >
                    {expandedSteps.has(index) ? (
                      <ChevronDown className="h-3 w-3 mr-1" />
                    ) : (
                      <ChevronRight className="h-3 w-3 mr-1" />
                    )}
                    {step.subitems.length} Unterschritte
                  </Button>
                )}
              </div>
            </div>
            <MemberSelect
              value={step.assignedUserId}
              onChange={(userId) => onUpdateStep(index, userId)}
              teamMembers={teamMembers}
              isLoading={isLoadingMembers}
            />
          </div>

          {expandedSteps.has(index) && step.subitems && step.subitems.length > 0 && (
            <div className="mt-3 ml-8 pl-4 border-l-2 border-blue-200 space-y-2">
              {step.subitems.map((subitem, subIndex) => (
                <div key={subIndex} className="flex items-center justify-between gap-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    </div>
                    <span className="text-sm">{subitem.title}</span>
                  </div>
                  <MemberSelect
                    value={subitem.assignedUserId}
                    onChange={(userId) => onUpdateSubitem(index, subIndex, userId)}
                    teamMembers={teamMembers}
                    isLoading={isLoadingMembers}
                    className="w-[180px] h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

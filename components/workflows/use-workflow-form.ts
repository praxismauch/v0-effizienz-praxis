"use client"

import { useState, useEffect } from "react"
import { useWorkflow, type WorkflowTemplate } from "@/contexts/workflow-context"
import { useTeam } from "@/contexts/team-context"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"

export interface StepAssignment {
  title: string
  assignedUserId?: string
  assignedTo?: string
  subitems?: StepAssignment[]
}

export function useWorkflowForm(template: WorkflowTemplate | null, open: boolean) {
  const { createWorkflowFromTemplate } = useWorkflow()
  const { teamMembers: contextTeamMembers, loading: teamLoading } = useTeam()
  const { currentPractice } = usePractice()
  const { user } = useUser()

  const [workflowName, setWorkflowName] = useState("")
  const [workflowDescription, setWorkflowDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium")
  const [stepAssignments, setStepAssignments] = useState<StepAssignment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())

  const [localTeamMembers, setLocalTeamMembers] = useState<any[]>([])
  const [loadingLocalMembers, setLoadingLocalMembers] = useState(false)

  const teamMembers = contextTeamMembers?.length > 0 ? contextTeamMembers : localTeamMembers
  const isLoadingMembers = teamLoading || loadingLocalMembers

  // Fetch team members locally if context doesn't have them
  useEffect(() => {
    const fetchLocalTeamMembers = async () => {
      if (!open || !currentPractice?.id) return
      if (contextTeamMembers && contextTeamMembers.length > 0) return

      setLoadingLocalMembers(true)
      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/team-members`)
        if (response.ok) {
          const data = await response.json()
          const members = Array.isArray(data) ? data : data.teamMembers || data.members || []
          setLocalTeamMembers(members.filter((m: any) => m.id && m.id.trim() !== ""))
        }
      } catch (err) {
        console.error("Error fetching local team members:", err)
      } finally {
        setLoadingLocalMembers(false)
      }
    }
    fetchLocalTeamMembers()
  }, [open, currentPractice?.id, contextTeamMembers])

  // Initialize form when template changes
  useEffect(() => {
    if (template && open) {
      setWorkflowName(template.title)
      setWorkflowDescription(template.description || "")
      setPriority("medium")
      setError(null)
      setStepAssignments(
        template.steps.map((step) => ({
          title: step.title,
          assignedUserId: step.assignedUserId,
          assignedTo: step.assignedTo,
          subitems: step.subitems?.map((sub: any) => ({
            title: sub.title,
            assignedUserId: sub.assignedUserId,
            assignedTo: sub.assignedTo,
          })),
        })),
      )
    }
  }, [template, open])

  const updateStepAssignment = (index: number, userId: string | undefined) => {
    const member = userId ? teamMembers.find((m) => m.userId === userId || m.id === userId) : undefined
    setStepAssignments((prev) =>
      prev.map((step, i) =>
        i === index ? { ...step, assignedUserId: userId, assignedTo: member?.name } : step,
      ),
    )
  }

  const updateSubitemAssignment = (stepIndex: number, subitemIndex: number, userId: string | undefined) => {
    const member = userId ? teamMembers.find((m) => m.userId === userId || m.id === userId) : undefined
    setStepAssignments((prev) =>
      prev.map((step, i) => {
        if (i !== stepIndex || !step.subitems) return step
        return {
          ...step,
          subitems: step.subitems.map((sub, j) =>
            j === subitemIndex ? { ...sub, assignedUserId: userId, assignedTo: member?.name } : sub,
          ),
        }
      }),
    )
  }

  const toggleStepExpanded = (index: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleCreate = async (onSuccess?: (w: any) => void, onClose?: () => void) => {
    if (!template) return
    if (!workflowName.trim()) {
      setError("Bitte geben Sie einen Namen für den Workflow ein.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const stepsWithAssignments = template.steps.map((step, index) => ({
        ...step,
        assignedUserId: stepAssignments[index]?.assignedUserId,
        assignedTo: stepAssignments[index]?.assignedTo,
        subitems: step.subitems?.map((sub: any, subIndex: number) => ({
          ...sub,
          assignedUserId: stepAssignments[index]?.subitems?.[subIndex]?.assignedUserId,
          assignedTo: stepAssignments[index]?.subitems?.[subIndex]?.assignedTo,
        })),
      }))

      const result = await createWorkflowFromTemplate(template.id, {
        title: workflowName,
        description: workflowDescription,
        priority,
        createdBy: user?.name || "Current User",
        steps: stepsWithAssignments as any,
      })

      if (result) {
        onSuccess?.(result)
        onClose?.()
      }
    } catch (err) {
      console.error("Error creating workflow from template:", err)
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen des Workflows")
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    workflowName,
    setWorkflowName,
    workflowDescription,
    setWorkflowDescription,
    priority,
    setPriority,
    stepAssignments,
    expandedSteps,
    isSubmitting,
    error,
    teamMembers,
    isLoadingMembers,
    updateStepAssignment,
    updateSubitemAssignment,
    toggleStepExpanded,
    handleCreate,
  }
}
